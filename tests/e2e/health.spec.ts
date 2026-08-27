import { expect, test } from '@playwright/test';

test('health endpoint exposes only minimal readiness state', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toContain('no-store');
  expect(response.headers()['x-robots-tag']).toContain('noindex');

  const body = await response.json() as Record<string, unknown>;
  expect(body).toEqual({ status: 'ok' });
  expect(body).not.toHaveProperty('databaseUrl');
  expect(body).not.toHaveProperty('version');
  expect(body).not.toHaveProperty('error');
  expect(body).not.toHaveProperty('stack');
});
