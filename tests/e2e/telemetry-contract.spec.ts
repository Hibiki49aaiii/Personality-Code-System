import { expect, test } from '@playwright/test';

test('performance analytics accepts bucket-only Web Vitals and rejects raw values', async ({ request }) => {
  const accepted = await request.post('/api/analytics', {
    data: {
      name: 'performance_measure',
      properties: {
        metric: 'LCP',
        bucket: 'good'
      }
    }
  });
  expect(accepted.status()).toBe(202);
  expect(await accepted.json()).toEqual({ ok: true });

  const rejected = await request.post('/api/analytics', {
    data: {
      name: 'performance_measure',
      properties: {
        metric: 'LCP',
        bucket: 'good',
        value: 1234.56,
        id: 'raw-web-vital-id'
      }
    }
  });
  expect(rejected.status()).toBe(400);

  const body = await rejected.json() as Record<string, unknown>;
  expect(body.error).toBe('UNKNOWN_PROPERTY');
  expect(JSON.stringify(body)).not.toContain('1234.56');
  expect(JSON.stringify(body)).not.toContain('raw-web-vital-id');
});

test('error analytics rejects free-form message or stack properties at the API boundary', async ({ request }) => {
  const rejected = await request.post('/api/analytics', {
    data: {
      name: 'client_error',
      properties: {
        category: 'request-failure',
        surface: 'assessment',
        message: 'private runtime detail',
        stack: 'sensitive stack trace'
      }
    }
  });

  expect(rejected.status()).toBe(400);
  const body = await rejected.json() as Record<string, unknown>;
  expect(body.error).toBe('UNKNOWN_PROPERTY');
  expect(JSON.stringify(body)).not.toContain('private runtime detail');
  expect(JSON.stringify(body)).not.toContain('sensitive stack trace');
});
