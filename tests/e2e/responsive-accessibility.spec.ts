import { expect, test, type Page } from '@playwright/test';

const viewports = [
  { width: 320, height: 844 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 }
] as const;

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth
  }));

  expect(dimensions.documentScrollWidth).toBeLessThanOrEqual(dimensions.innerWidth + 1);
  expect(dimensions.bodyScrollWidth).toBeLessThanOrEqual(dimensions.innerWidth + 1);
}

test('landing and assessment remain functional without horizontal overflow at every mandatory width', async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /診断/ }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto('/diagnosis');
    await expect(page.getByText('QUESTION 001')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'どちらともいえない' })).toBeVisible();
    await expect(page.getByRole('button', { name: '次へ →' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});

test('assessment can be completed without mouse or touch and the result remains usable at every mandatory width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/diagnosis');
  await expect(page.getByText('QUESTION 001')).toBeVisible();

  for (let index = 0; index < 147; index += 1) {
    const midpoint = page.getByRole('radio', { name: 'どちらともいえない' });
    await midpoint.press('Space');
    await expect(midpoint).toBeChecked();

    if (index < 146) {
      const next = page.getByRole('button', { name: '次へ →' });
      await expect(next).toBeEnabled();
      await next.press('Enter');
      await expect(page.getByText(`QUESTION ${String(index + 2).padStart(3, '0')}`)).toBeVisible();
    }
  }

  const finish = page.getByRole('button', { name: '診断結果を確定' });
  await expect(finish).toBeEnabled();
  await finish.press('Enter');

  await expect(page).toHaveURL(/\/result$/);
  await expect(page.getByRole('heading', { level: 1, name: 'SVAEND' })).toBeVisible();

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await expect(page.getByRole('heading', { level: 1, name: 'SVAEND' })).toBeVisible();
    await expect(page.getByText('Trait Vector', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '公開共有リンクを作成' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});

test('focus indicators and reduced-motion behavior are present in the production UI contract', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/diagnosis');
  await expect(page.getByText('QUESTION 001')).toBeVisible();

  const radio = page.getByRole('radio', { name: 'どちらともいえない' });
  await radio.focus();
  const focusOutline = await radio.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      transitionDuration: style.transitionDuration,
      animationDuration: style.animationDuration
    };
  });

  expect(focusOutline.outlineStyle).not.toBe('none');
  expect(parseFloat(focusOutline.outlineWidth)).toBeGreaterThan(0);

  const progress = page.locator('[class*="progressTrack"] span');
  const progressStyle = await progress.evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(progressStyle === '0s' || progressStyle === '0.01ms').toBe(true);
});
