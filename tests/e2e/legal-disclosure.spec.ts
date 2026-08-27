import { expect, test } from '@playwright/test';

test('pre-launch legal/privacy drafts are reachable, explicit and non-indexable', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'PRIVACY DRAFT' })).toHaveAttribute('href', '/privacy');
  await expect(page.getByRole('link', { name: 'TERMS / LIMITATIONS DRAFT' })).toHaveAttribute('href', '/terms');

  await page.getByRole('link', { name: 'PRIVACY DRAFT' }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole('heading', { level: 1, name: 'プライバシー説明' })).toBeVisible();
  await expect(page.getByText('PRIVACY · PRE-LAUNCH DRAFT')).toBeVisible();
  await expect(page.getByText(/匿名診断データの自己削除/)).toBeVisible();
  await expect(page.getByText(/放棄session 30日、completed raw answers 90日/)).toBeVisible();
  await expect(page.getByText(/production証拠は未完/)).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);

  await page.getByRole('link', { name: '利用条件・診断上の制約ドラフト →' }).click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(page.getByRole('heading', { level: 1, name: '利用条件・診断上の制約' })).toBeVisible();
  await expect(page.getByText('TERMS / LIMITATIONS · PRE-LAUNCH DRAFT')).toBeVisible();
  await expect(page.getByText(/PCSは医療・臨床診断ではありません/)).toBeVisible();
  await expect(page.getByText(/64種類の自然な人格類型が実証されたという意味ではありません/)).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
});
