import { expect, test } from '@playwright/test';

test('anonymous user completes the private result and can explicitly create then revoke a sanitized public share', async ({ page, browser }) => {
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

  const traitBars = page.locator('[aria-label^="ABS "]');
  await expect(traitBars).toHaveCount(1);
  await expect(traitBars).toHaveAttribute('aria-label', 'ABS 50.00');
  await expect(page.locator('code')).toHaveCount(26);
  await expect(page.locator('code', { hasText: 'DEV-FALLBACK-' })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'SVAEND' })).toBeVisible();
  await expect(page.getByText('result-snapshot-v0.1-dev', { exact: true })).toBeVisible();
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

  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();
  await publicPage.goto(shareUrl!);
  await expect(publicPage.getByText('PUBLIC SHARE · SANITIZED')).toBeVisible();
  await expect(publicPage.getByRole('heading', { level: 1, name: 'SVAEND' })).toBeVisible();
  await expect(publicPage.getByText('share-snapshot-v0.1-dev', { exact: true })).toBeVisible();
  await expect(publicPage.getByText(/PCSX1/)).toHaveCount(0);
  await expect(publicPage.getByText('Trait Vector', { exact: true })).toHaveCount(0);
  await expect(publicPage.getByText(/all_midpoint_responses/)).toHaveCount(0);
  await expect(publicPage.getByText(/DEV-TRAIT-/)).toHaveCount(0);

  await page.getByRole('button', { name: 'この結果の公開リンクをすべて無効化' }).click();
  await expect(page.getByText(/1件の公開共有リンクを無効化しました/)).toBeVisible();

  await publicPage.reload();
  await expect(publicPage.getByRole('heading', { level: 1, name: 'この共有リンクは利用できません' })).toBeVisible();
  await publicContext.close();
});

test('private result is not retrievable in a fresh browser context without the bearer cookie', async ({ page }) => {
  await page.goto('/result');
  await expect(page.getByText('このブラウザに診断セッションがありません。')).toBeVisible();
  await expect(page.getByRole('link', { name: '診断へ進む' })).toBeVisible();
});
