import { expect, test } from '@playwright/test';

test('cookie-authenticated mutations reject cross-site browser origins without leaking internals', async ({ request }) => {
  const hostileSession = await request.post('/api/assessment/session', {
    headers: hostileHeaders
  });
  expect(hostileSession.status()).toBe(403);

  const sessionAfterRejectedStart = await request.get('/api/assessment/session');
  expect(sessionAfterRejectedStart.status()).toBe(401);

  const hostileAnalytics = await request.post('/api/analytics', {
    headers: hostileHeaders,
    data: {
      name: 'landing_viewed',
      properties: { viewportCategory: 'desktop' }
    }
  });
  expect(hostileAnalytics.status()).toBe(403);

  const started = await request.post('/api/assessment/session', {
    headers: { 'x-forwarded-for': '198.51.100.88' }
  });
  expect([200, 201]).toContain(started.status());

  const state = await started.json() as {
    items: Array<{ id: string }>;
  };
  expect(state.items.length).toBeGreaterThan(0);

  const hostileHeaders = {
    origin: 'https://attacker.example',
    'sec-fetch-site': 'cross-site'
  };

  const answer = await request.put('/api/assessment/answer', {
    headers: hostileHeaders,
    data: {
      itemId: state.items[0]!.id,
      value: 3
    }
  });
  expect(answer.status()).toBe(403);

  const complete = await request.post('/api/assessment/complete', {
    headers: hostileHeaders
  });
  expect(complete.status()).toBe(403);

  const share = await request.post('/api/share', {
    headers: hostileHeaders
  });
  expect(share.status()).toBe(403);

  const dataDeletion = await request.delete('/api/assessment/data', {
    headers: hostileHeaders
  });
  expect(dataDeletion.status()).toBe(403);

  for (const response of [hostileSession, hostileAnalytics, answer, complete, share, dataDeletion]) {
    const body = await response.json() as Record<string, unknown>;
    expect(body.error).toBe('CROSS_SITE_MUTATION_REJECTED');
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('attacker.example');
    expect(serialized).not.toContain('PCS_RATE_LIMIT_SECRET');
    expect(serialized).not.toContain('DATABASE_URL');
    expect(serialized).not.toContain('stack');
    expect(serialized).not.toMatch(/[a-f0-9]{64}/);
  }

  // Verify the rejected answer had no side effect.
  const resumed = await request.get('/api/assessment/session');
  expect(resumed.status()).toBe(200);
  const resumedState = await resumed.json() as { answers: unknown[] };
  expect(resumedState.answers).toHaveLength(0);
});
