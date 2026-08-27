import { expect, test } from '@playwright/test';

test('pre-launch runtime is crawler fail-closed while preview remains usable', async ({ page, request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Disallow: /');

  await page.goto('/');
  const robotsMeta = page.locator('meta[name="robots"]');
  await expect(robotsMeta).toHaveAttribute('content', /noindex/i);
  await expect(robotsMeta).toHaveAttribute('content', /nofollow/i);

  await page.goto('/diagnosis');
  await expect(page.getByText('QUESTION 001')).toBeVisible();
});
