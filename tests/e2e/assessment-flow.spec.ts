import { expect, test } from '@playwright/test';
import postgres from 'postgres';

test('anonymous user completes the private result and can explicitly create then revoke a sanitized public share', async ({ page, browser }) => {
  const analyticsPayloads: Array<{ name?: string; properties?: Record<string, unknown> }> = [];
  const analyticsStatuses: number[] = [];

  page.on('request', (request) => {
    if (!request.url().endsWith('/api/analytics') || request.method() !== 'POST') return;
    try {
      analyticsPayloads.push(JSON.parse(request.postData() ?? '{}') as { name?: string; properties?: Record<string, unknown> });
    } catch {
      analyticsPayloads.push({});
    }
  });
  page.on('response', (response) => {
    if (response.url().endsWith('/api/analytics')) analyticsStatuses.push(response.status());
  });

  await page.goto('/diagnosis');

  await expect(page.getByText('REVIEWED DEVELOPMENT ASSESSMENT')).toBeVisible();
  await expect(page.getByText(/001 \/ 147/)).toBeVisible();

  const midpoint = page.getByRole('radio', { name: 'どちらともいえない' });
  const somewhatApplies = page.getByRole('radio', { name: 'やや当てはまる' });

  await somewhatApplies.click();
  await page.getByRole('button', { name: '次へ →' }).click();
  await expect(page.getByText('QUESTION 002')).toBeVisible();
  await page.getByRole('button', { name: '← 戻る' }).click();
  await expect(page.getByText('QUESTION 001')).toBeVisible();
  await expect(somewhatApplies).toBeChecked();
  await midpoint.click();
  await page.getByRole('button', { name: '次へ →' }).click();

  // Re-enter the assessment with the same HttpOnly session to verify resume behavior and telemetry.
  await page.reload();
  await expect(page.getByText('QUESTION 002')).toBeVisible();

  for (let index = 1; index < 147; index += 1) {
    await expect(page.getByText(`QUESTION ${String(index + 1).padStart(3, '0')}`)).toBeVisible();
    await midpoint.click();
    if (index < 146) {
      const next = page.getByRole('button', { name: '次へ →' });
      await expect(next).toBeEnabled();
      await next.click();
    }
  }

  const finish = page.getByRole('button', { name: '診断結果を確定' });
  await expect(finish).toBeEnabled();
  await finish.click();

  await expect(page).toHaveURL(/\/result$/);
  await expect(page.getByRole('heading', { level: 1, name: 'SVAEND' })).toBeVisible();
  await expect(page.getByText(/PCSX1~C01D~SVAEND~/)).toBeVisible();
  await expect(page.getByText(/深度・開拓実行型 自律検証設計者/)).toBeVisible();
  await expect(page.getByText('content-dev-v0.3', { exact: true })).toBeVisible();

  for (const moduleId of [
    'DEV-TYPE-SVAEND-IDENTITY',
    'DEV-TYPE-SVAEND-STRENGTHS',
    'DEV-TYPE-SVAEND-ADVERSARIAL',
    'DEV-TRAIT-SYS-MID',
    'DEV-TRAIT-RDP-MID',
    'DEV-TRAIT-OPT-MID',
    'DEV-TRAIT-UNC-MID',
    'DEV-TRAIT-FIN-MID'
  ]) {
    await expect(page.getByText(moduleId, { exact: true })).toBeVisible();
  }

  await expect(page.getByText(/構造化思考:/)).toBeVisible();
  await expect(page.getByText(/関係深度:/)).toBeVisible();
  await expect(page.getByText(/最適化欲求:/)).toBeVisible();
  await expect(page.getByText(/不確実性耐性:/)).toBeVisible();

  const traitBars = page.getByRole('meter', { name: 'ABS Trait score' });
  await expect(traitBars).toHaveCount(1);
  await expect(traitBars).toHaveAttribute('aria-valuenow', '50');
  await expect(traitBars).toHaveAttribute('aria-valuetext', '50.00 / 100');
  await expect(page.locator('code')).toHaveCount(26);
  await expect(page.locator('code', { hasText: 'DEV-FALLBACK-' })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'SVAEND' })).toBeVisible();
  await expect(page.getByText('result-snapshot-v0.2-dev', { exact: true })).toBeVisible();
  await expect(page.getByText('ILL-PCS-FALLBACK-HERO-v01', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('DEV-TRAIT-SYS-MID', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '公開共有リンクを作成' }).click();
  await expect(page.getByText(/公開用の共有リンクを作成しました/)).toBeVisible();

  const shareLink = page.locator('a[href*="/s/"]').first();
  await expect(shareLink).toBeVisible();
  const shareUrl = await shareLink.getAttribute('href');
  expect(shareUrl).toMatch(/^http:\/\/localhost:3000\/s\/[A-Za-z0-9_-]{43}$/);

  await expect(page.getByRole('button', { name: '端末で共有' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'リンクをコピー' })).toBeVisible();
  const xShare = page.getByRole('link', { name: 'X', exact: true });
  const lineShare = page.getByRole('link', { name: 'LINE', exact: true });
  await expect(xShare).toHaveAttribute('href', /twitter\.com\/intent\/tweet/);
  await expect(lineShare).toHaveAttribute('href', /social-plugins\.line\.me\/lineit\/share/);
  expect(await xShare.getAttribute('href')).toContain(encodeURIComponent(shareUrl!));
  expect(await lineShare.getAttribute('href')).toContain(encodeURIComponent(shareUrl!));

  const copyAnalyticsResponse = page.waitForResponse((response) => {
    if (!response.url().endsWith('/api/analytics')) return false;
    try {
      const payload = JSON.parse(response.request().postData() ?? '{}') as { name?: string; properties?: { method?: string } };
      return payload.name === 'share_method_selected' && payload.properties?.method === 'copy';
    } catch {
      return false;
    }
  });
  await page.getByRole('button', { name: 'リンクをコピー' }).click();
  expect((await copyAnalyticsResponse).status()).toBe(202);

  const shareToken = new URL(shareUrl!).pathname.split('/').filter(Boolean).at(-1);
  expect(shareToken).toMatch(/^[A-Za-z0-9_-]{43}$/);

  const publicContext = await browser.newContext();
  const ogResponse = await publicContext.request.get(`/api/share/og/v0.1/${shareToken}`);
  expect(ogResponse.status()).toBe(200);
  expect(ogResponse.headers()['content-type']).toContain('image/png');
  expect(ogResponse.headers()['x-pcs-share-template']).toBe('share-og-v0.1-dev');
  expect(ogResponse.headers()['x-pcs-illustration-asset']).toBe('ILL-PCS-FALLBACK-HERO-v01');
  const repeatedOgResponse = await publicContext.request.get(`/api/share/og/v0.1/${shareToken}`);
  expect(repeatedOgResponse.status()).toBe(200);
  expect(Buffer.compare(await ogResponse.body(), await repeatedOgResponse.body())).toBe(0);

  const portraitResponse = await publicContext.request.get(`/api/share/card/v0.1/${shareToken}`);
  expect(portraitResponse.status()).toBe(200);
  expect(portraitResponse.headers()['content-type']).toContain('image/png');
  expect(portraitResponse.headers()['x-pcs-share-template']).toBe('share-portrait-v0.1-dev');
  expect(portraitResponse.headers()['x-pcs-illustration-asset']).toBe('ILL-PCS-FALLBACK-HERO-v01');
  const repeatedPortraitResponse = await publicContext.request.get(`/api/share/card/v0.1/${shareToken}`);
  expect(repeatedPortraitResponse.status()).toBe(200);
  expect(Buffer.compare(await portraitResponse.body(), await repeatedPortraitResponse.body())).toBe(0);
  await expect(page.getByRole('link', { name: '縦型画像' })).toHaveAttribute(
    'href',
    `/api/share/card/v0.1/${shareToken}`
  );

  const publicPage = await publicContext.newPage();
  await publicPage.goto(shareUrl!);
  await expect(publicPage.getByText('PUBLIC SHARE · SANITIZED')).toBeVisible();
  await expect(publicPage.getByRole('heading', { level: 1, name: 'SVAEND' })).toBeVisible();
  await expect(publicPage.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    `http://localhost:3000/api/share/og/v0.1/${shareToken}`
  );
  await expect(publicPage.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image'
  );
  await expect(publicPage.getByText('share-snapshot-v0.1-dev', { exact: true })).toBeVisible();
  await expect(publicPage.getByText('ILL-PCS-FALLBACK-HERO-v01', { exact: true }).first()).toBeVisible();
  await expect(publicPage.getByText(/PCSX1/)).toHaveCount(0);
  await expect(publicPage.getByText('Trait Vector', { exact: true })).toHaveCount(0);
  await expect(publicPage.getByText(/all_midpoint_responses/)).toHaveCount(0);
  await expect(publicPage.getByText(/DEV-TRAIT-/)).toHaveCount(0);

  await page.getByRole('button', { name: 'この結果の公開リンクをすべて無効化' }).click();
  await expect(page.getByText(/1件の公開共有リンクを無効化しました/)).toBeVisible();

  await publicPage.reload();
  await expect(publicPage.getByRole('heading', { level: 1, name: 'この共有リンクは利用できません' })).toBeVisible();

  const revokedOg = await publicContext.request.get(`/api/share/og/v0.1/${shareToken}`);
  expect(revokedOg.status()).toBe(404);
  const revokedPortrait = await publicContext.request.get(`/api/share/card/v0.1/${shareToken}`);
  expect(revokedPortrait.status()).toBe(404);

  await publicContext.close();

  await expect.poll(() => analyticsStatuses.length, { timeout: 10_000 }).toBeGreaterThan(5);
  expect(analyticsStatuses.every((status) => status === 202)).toBe(true);

  const answerAnalytics = analyticsPayloads.filter((payload) => payload.name === 'answer_interaction');
  expect(answerAnalytics.length).toBeGreaterThan(0);
  for (const payload of answerAnalytics) {
    expect(payload.properties).toHaveProperty('itemPosition');
    expect(payload.properties).toHaveProperty('interactionType');
    expect(payload.properties).not.toHaveProperty('answer');
    expect(payload.properties).not.toHaveProperty('answerValue');
    expect(payload.properties).not.toHaveProperty('value');
    expect(payload.properties).not.toHaveProperty('modelVersion');
  }

  const questionAnalytics = analyticsPayloads.filter((payload) => payload.name === 'question_viewed');
  expect(questionAnalytics.length).toBeGreaterThan(0);
  for (const payload of questionAnalytics) {
    expect(payload.properties).not.toHaveProperty('modelVersion');
  }

  const databaseUrl = process.env.DATABASE_URL;
  expect(databaseUrl).toBeTruthy();
  const sql = postgres(databaseUrl!, { max: 1 });
  try {
    const rows = await sql<{ event_name: string; properties_json: Record<string, unknown> }[]>`
      SELECT event_name, properties_json
      FROM product_events
      ORDER BY created_at
    `;
    const funnelEvents = new Set(rows.map((row) => row.event_name));
    for (const requiredEvent of [
      'assessment_started',
      'assessment_resumed',
      'question_viewed',
      'answer_interaction',
      'assessment_completed',
      'result_viewed',
      'share_initiated',
      'share_method_selected',
      'share_snapshot_created',
      'public_share_viewed'
    ]) {
      expect(funnelEvents.has(requiredEvent), `missing persisted funnel event ${requiredEvent}`).toBe(true);
    }

    for (const row of rows.filter((entry) => entry.event_name === 'answer_interaction')) {
      expect(row.properties_json).not.toHaveProperty('answer');
      expect(row.properties_json).not.toHaveProperty('answerValue');
      expect(row.properties_json).not.toHaveProperty('value');
      expect(row.properties_json).not.toHaveProperty('traitScores');
    }
    const persistedQuestion = rows.find((entry) => entry.event_name === 'question_viewed');
    expect(persistedQuestion?.properties_json).toHaveProperty('modelVersion', 'assessment-dev-v0.3');
  } finally {
    await sql.end({ timeout: 5 });
  }

  await page.getByRole('button', { name: '診断データを削除' }).click();
  await expect(page.getByRole('group', { name: '診断データ削除の確認' })).toBeVisible();
  await expect(page.getByText('この操作は取り消せません。')).toBeVisible();
  await page.getByRole('button', { name: '削除を確定' }).click();
  await expect(page).toHaveURL('http://localhost:3000/');

  await page.goto('/result');
  await expect(page.getByText('このブラウザに診断セッションがありません。')).toBeVisible();

});

test('private result is not retrievable in a fresh browser context without the bearer cookie', async ({ page }) => {
  await page.goto('/result');
  await expect(page.getByText('このブラウザに診断セッションがありません。')).toBeVisible();
  await expect(page.getByRole('link', { name: '診断へ進む' })).toBeVisible();
});


test('landing page emits only the minimal first-party landing analytics payload', async ({ page }) => {
  const analyticsResponsePromise = page.waitForResponse((response) => {
    if (!response.url().endsWith('/api/analytics')) return false;
    try {
      const payload = JSON.parse(response.request().postData() ?? '{}') as { name?: string };
      return payload.name === 'landing_viewed';
    } catch {
      return false;
    }
  });

  await page.goto('/');
  const analyticsResponse = await analyticsResponsePromise;
  expect(analyticsResponse.status()).toBe(202);

  const observedPayload = JSON.parse(
    analyticsResponse.request().postData() ?? '{}'
  ) as { name?: string; properties?: Record<string, unknown> };

  expect(observedPayload.name).toBe('landing_viewed');
  expect(observedPayload.properties).toHaveProperty('viewportCategory');
  expect(observedPayload.properties).toHaveProperty('locale');
  expect(observedPayload.properties).not.toHaveProperty('traitScores');
  expect(observedPayload.properties).not.toHaveProperty('answerValue');
  expect(observedPayload.properties).not.toHaveProperty('sessionToken');
});


test('assessment request failure emits only fixed error telemetry', async ({ page }) => {
  await page.goto('/diagnosis');
  await expect(page.getByText('QUESTION 001')).toBeVisible();

  await page.route('**/api/assessment/answer', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'TEST_FAILURE',
        message: 'simulated failure with details that must not enter analytics'
      })
    });
  });

  const errorAnalyticsPromise = page.waitForResponse((response) => {
    if (!response.url().endsWith('/api/analytics')) return false;
    try {
      const payload = JSON.parse(response.request().postData() ?? '{}') as {
        name?: string;
        properties?: { category?: string; surface?: string };
      };
      return (
        payload.name === 'client_error' &&
        payload.properties?.category === 'request-failure' &&
        payload.properties?.surface === 'assessment'
      );
    } catch {
      return false;
    }
  });

  await page.getByRole('radio', { name: 'どちらともいえない' }).click();
  await expect(page.locator('p[role="alert"]')).toContainText('simulated failure');

  const analyticsResponse = await errorAnalyticsPromise;
  expect(analyticsResponse.status()).toBe(202);

  const payload = JSON.parse(
    analyticsResponse.request().postData() ?? '{}'
  ) as { name?: string; properties?: Record<string, unknown> };

  expect(payload).toEqual({
    name: 'client_error',
    properties: {
      category: 'request-failure',
      surface: 'assessment'
    }
  });
  expect(JSON.stringify(payload)).not.toContain('simulated failure');
  expect(payload.properties).not.toHaveProperty('message');
  expect(payload.properties).not.toHaveProperty('stack');
});
