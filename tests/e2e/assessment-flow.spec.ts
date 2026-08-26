import { expect, test } from '@playwright/test';

test('anonymous user completes all 147 reviewed items and receives the deterministic private result', async ({ page }) => {
  await page.goto('/diagnosis');

  await expect(page.getByText('REVIEWED DEVELOPMENT ASSESSMENT')).toBeVisible();
  await expect(page.getByText(/001 \/ 147/)).toBeVisible();

  const midpoint = page.getByRole('radio', { name: 'どちらともいえない' });

  for (let index = 0; index < 147; index += 1) {
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
  await expect(page.getByText('21', { exact: true })).toHaveCount(0);

  const traitBars = page.locator('[aria-label^="ABS "]');
  await expect(traitBars).toHaveCount(1);
  await expect(traitBars).toHaveAttribute('aria-label', 'ABS 50.00');
  await expect(page.locator('code')).toHaveCount(18);

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'SVAEND' })).toBeVisible();
  await expect(page.getByText(/snapshot-v0.1-dev/)).toBeVisible();
});
