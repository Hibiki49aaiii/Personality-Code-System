import { expect, test, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import profileData from '../../data/performance/lab-profile-v0.1-dev.json';

type SurfaceName = 'landing' | 'assessment' | 'private-result' | 'public-share';
type Metric = {
  surface: SurfaceName;
  LCP_ms: number | null;
  CLS: number;
  TTFB_ms: number | null;
  max_interaction_event_ms: number;
};

declare global {
  interface Window {
    __pcsPerf?: {
      lcp: number;
      cls: number;
      maxEvent: number;
    };
  }
}

async function installPerformanceObservers(page: Page) {
  await page.addInitScript(() => {
    window.__pcsPerf = { lcp: 0, cls: 0, maxEvent: 0 };

    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries.at(-1);
        if (last) window.__pcsPerf!.lcp = last.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {}

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
          if (!shift.hadRecentInput && typeof shift.value === 'number') {
            window.__pcsPerf!.cls += shift.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {}

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > window.__pcsPerf!.maxEvent) {
            window.__pcsPerf!.maxEvent = entry.duration;
          }
        }
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
    } catch {}
  });
}

async function readMetric(page: Page, surface: SurfaceName): Promise<Metric> {
  await page.waitForTimeout(800);
  return page.evaluate((surfaceName) => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const p = window.__pcsPerf ?? { lcp: 0, cls: 0, maxEvent: 0 };
    return {
      surface: surfaceName,
      LCP_ms: p.lcp > 0 ? Math.round(p.lcp) : null,
      CLS: Number(p.cls.toFixed(4)),
      TTFB_ms: nav ? Math.round(nav.responseStart - nav.requestStart) : null,
      max_interaction_event_ms: Math.round(p.maxEvent)
    };
  }, surface);
}

async function applyLabProfile(page: Page, profileName: string) {
  const profile = profileData.profiles[profileName as keyof typeof profileData.profiles];
  if (!profile) throw new Error(`Unknown PCS_PERF_PROFILE ${profileName}`);

  await page.setViewportSize(profile.viewport);
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu_slowdown_rate });

  if (profile.network) {
    await session.send('Network.enable');
    await session.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: profile.network.latency_ms,
      downloadThroughput: profile.network.download_kbps * 1024 / 8,
      uploadThroughput: profile.network.upload_kbps * 1024 / 8,
      connectionType: 'cellular4g'
    });
  }
}

test('collect representative PCS lab performance evidence without claiming field CWV', async ({ page }) => {
  const profileName = process.env.PCS_PERF_PROFILE ?? 'desktop_ci';
  await installPerformanceObservers(page);
  await applyLabProfile(page, profileName);

  const metrics: Metric[] = [];

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  metrics.push(await readMetric(page, 'landing'));

  await page.goto('/diagnosis');
  await expect(page.getByText('QUESTION 001')).toBeVisible();
  await page.getByRole('radio', { name: 'どちらともいえない' }).click();
  metrics.push(await readMetric(page, 'assessment'));

  for (let index = 0; index < 147; index += 1) {
    if (index > 0) {
      await page.getByRole('radio', { name: 'どちらともいえない' }).click();
    }
    if (index < 146) {
      await page.getByRole('button', { name: '次へ →' }).click();
      await expect(page.getByText(`QUESTION ${String(index + 2).padStart(3, '0')}`)).toBeVisible();
    }
  }

  await page.getByRole('button', { name: '診断結果を確定' }).click();
  await expect(page).toHaveURL(/\/result$/);
  await expect(page.getByRole('heading', { level: 1, name: 'SVAEND' })).toBeVisible();

  // Force a full-document result load so LCP/CLS/TTFB are surface-specific.
  await page.goto('/result');
  await expect(page.getByRole('heading', { level: 1, name: 'SVAEND' })).toBeVisible();

  await page.getByRole('button', { name: '公開共有リンクを作成' }).click();
  const shareLink = page.locator('a[href*="/s/"]').first();
  await expect(shareLink).toBeVisible();
  const shareUrl = await shareLink.getAttribute('href');
  expect(shareUrl).toBeTruthy();
  metrics.push(await readMetric(page, 'private-result'));

  await page.goto(shareUrl!);
  await expect(page.getByText('PUBLIC SHARE · SANITIZED')).toBeVisible();
  metrics.push(await readMetric(page, 'public-share'));

  for (const metric of metrics) {
    expect(metric.TTFB_ms, `${metric.surface}: TTFB unavailable`).not.toBeNull();
    expect(metric.CLS, `${metric.surface}: invalid CLS`).toBeGreaterThanOrEqual(0);
  }

  const output = {
    lab_profile_version: profileData.lab_profile_version,
    profile: profileName,
    collected_at: new Date().toISOString(),
    runner: process.env.CI ? 'github-actions' : 'local',
    field_data: false,
    master_requirement_closure: false,
    metrics
  };

  await mkdir('artifacts/performance-lab', { recursive: true });
  await writeFile(
    `artifacts/performance-lab/${profileName}.json`,
    JSON.stringify(output, null, 2) + '\n',
    'utf8'
  );

  console.log('PCS performance lab summary:', JSON.stringify(output));
});
