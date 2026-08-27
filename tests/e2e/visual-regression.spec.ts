import { expect, test } from '@playwright/test';

const visualEnabled = process.env.PCS_VISUAL_REGRESSION === '1';

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
