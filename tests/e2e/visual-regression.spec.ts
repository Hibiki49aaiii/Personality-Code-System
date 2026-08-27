import { expect, test } from '@playwright/test';

const visualEnabled = process.env.PCS_VISUAL_REGRESSION === '1';
// Intentional baseline refresh trigger: landing claim-review copy/sample alignment v0.1.

const viewports = [
  { label: '320', width: 320, height: 844 },
  { label: '390', width: 390, height: 844 },
  { label: '768', width: 768, height: 1024 },
  { label: '1024', width: 1024, height: 768 },
  { label: '1280', width: 1280, height: 800 },
  { label: '1440', width: 1440, height: 900 }
] as const;

test.describe('visual regression', () => {
  test.skip(!visualEnabled, 'Visual regression baselines are generated/verified only in the dedicated visual job.');

  for (const viewport of viewports) {
    test(`landing and assessment — ${viewport.label}px`, async ({ page }) => {
      await page.setViewportSize(viewport);

      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page).toHaveScreenshot(`landing-${viewport.label}.png`, {
        fullPage: true,
        animations: 'disabled',
        caret: 'hide',
        maxDiffPixelRatio: 0.002
      });

      await page.goto('/diagnosis');
      await expect(page.getByText('QUESTION 001')).toBeVisible();
      await expect(page).toHaveScreenshot(`assessment-first-${viewport.label}.png`, {
        fullPage: true,
        animations: 'disabled',
        caret: 'hide',
        maxDiffPixelRatio: 0.002
      });
    });
  }
});


test.describe('result and public-share visual regression', () => {
  test.skip(!visualEnabled, 'Visual regression baselines are generated/verified only in the dedicated visual job.');

  test('completed result and sanitized public share — mobile and desktop', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/diagnosis');
    await expect(page.getByText('QUESTION 001')).toBeVisible();

    for (let index = 0; index < 147; index += 1) {
      await page.getByRole('radio', { name: 'どちらともいえない' }).click();
      if (index < 146) {
        await page.getByRole('button', { name: '次へ →' }).click();
        await expect(page.getByText(`QUESTION ${String(index + 2).padStart(3, '0')}`)).toBeVisible();
      }
    }

    await page.getByRole('button', { name: '診断結果を確定' }).click();
    await expect(page).toHaveURL(/\/result$/);
    await expect(page.getByRole('heading', { level: 1, name: 'SVAEND' })).toBeVisible();

    await expect(page).toHaveScreenshot('result-390.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.002
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page).toHaveScreenshot('result-1440.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.002
    });

    await page.getByRole('button', { name: '公開共有リンクを作成' }).click();
    const shareLink = page.locator('a[href*="/s/"]').first();
    await expect(shareLink).toBeVisible();
    const shareUrl = await shareLink.getAttribute('href');
    expect(shareUrl).toBeTruthy();

    await page.goto(shareUrl!);
    await expect(page.getByText('PUBLIC SHARE · SANITIZED')).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page).toHaveScreenshot('public-share-390.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.002
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page).toHaveScreenshot('public-share-1440.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.002
    });
  });
});
