import { expect, test } from '@playwright/test';

test('assessment session creation is rate limited without exposing the client principal', async ({ request }) => {
  const headers = {
    'x-forwarded-for': '198.51.100.77'
  };

  for (let index = 0; index < 20; index += 1) {
    const response = await request.post('/api/assessment/session', { headers });
    expect([200, 201]).toContain(response.status());
  }

  const limited = await request.post('/api/assessment/session', { headers });
  expect(limited.status()).toBe(429);

  const retryAfter = Number(limited.headers()['retry-after']);
  expect(Number.isFinite(retryAfter)).toBe(true);
  expect(retryAfter).toBeGreaterThan(0);

  const body = await limited.json() as Record<string, unknown>;
  expect(body.error).toBe('RATE_LIMITED');

  const serialized = JSON.stringify(body);
  expect(serialized).not.toContain('198.51.100.77');
  expect(serialized).not.toMatch(/[a-f0-9]{64}/);
  expect(serialized).not.toContain('assessment-session-create');
});
