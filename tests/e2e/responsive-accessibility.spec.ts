import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const viewports = [
  { width: 320, height: 844 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 }
] as const;

async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(
    results.violations,
    results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.map((node) => node.target)
    }))
  ).toEqual([]);
}

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
  await expectNoA11yViolations(page);

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
  const transitionMs = progressStyle
    .split(',')
    .map((value) => value.trim())
    .map((value) => value.endsWith('ms')
      ? Number.parseFloat(value)
      : Number.parseFloat(value) * 1000);
  expect(transitionMs.every((value) => Number.isFinite(value) && value <= 0.1)).toBe(true);
});


test('assessment exposes progress semantics and practical touch targets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/diagnosis');
  await expect(page.getByText('QUESTION 001')).toBeVisible();

  const progress = page.getByRole('progressbar', { name: '診断の回答進捗' });
  await expect(progress).toHaveAttribute('aria-valuemin', '0');
  await expect(progress).toHaveAttribute('aria-valuemax', '147');
  await expect(progress).toHaveAttribute('aria-valuenow', '0');
  await expect(progress).toHaveAttribute('aria-valuetext', '147問中0問回答済み');

  const question = page.getByRole('heading', { level: 1 });
  const questionId = await question.getAttribute('id');
  expect(questionId).toBe('assessment-question');

  const group = page.getByRole('radiogroup');
  await expect(group).toHaveAttribute('aria-labelledby', 'assessment-question');

  const brandBox = await page.getByRole('link', { name: 'PCS' }).boundingBox();
  const backBox = await page.getByRole('button', { name: '← 戻る' }).boundingBox();
  const nextBox = await page.getByRole('button', { name: '次へ →' }).boundingBox();
  const optionBox = await page.getByRole('radio', { name: 'どちらともいえない' }).boundingBox();

  for (const box of [brandBox, backBox, nextBox, optionBox]) {
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }

  await page.getByRole('radio', { name: 'どちらともいえない' }).press('Space');
  await expect(progress).toHaveAttribute('aria-valuenow', '1');
  await expect(progress).toHaveAttribute('aria-valuetext', '147問中1問回答済み');
});


test('landing and first assessment screen pass automated WCAG A/AA checks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expectNoA11yViolations(page);

  await page.goto('/diagnosis');
  await expect(page.getByText('QUESTION 001')).toBeVisible();
  await expectNoA11yViolations(page);
});
