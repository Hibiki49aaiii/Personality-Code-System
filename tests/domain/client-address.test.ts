import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLOWED_CLIENT_IP_HEADERS,
  resolveClientAddress
} from '../../src/domain/security/clientAddress';

function headers(values: Record<string, string | undefined>) {
  const normalized = new Map(
    Object.entries(values)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key.toLowerCase(), value as string])
  );
  return (name: string) => normalized.get(name.toLowerCase()) ?? null;
}

test('production ignores generic forwarded headers unless one header is explicitly selected', () => {
  const getHeader = headers({
    'x-forwarded-for': '203.0.113.10',
    'x-real-ip': '203.0.113.11'
  });
  assert.equal(resolveClientAddress({
    deploymentEnvironment: 'production',
    getHeader
  }), 'unavailable');
});

test('production uses only the explicitly selected allowed edge header', () => {
  const getHeader = headers({
    'cf-connecting-ip': '2001:db8::1',
    'x-forwarded-for': '198.51.100.8'
  });
  assert.equal(resolveClientAddress({
    deploymentEnvironment: 'production',
    configuredHeader: 'CF-Connecting-IP',
    getHeader
  }), '2001:db8::1');
});

test('invalid configured header or arbitrary header payload fails closed', () => {
  assert.equal(resolveClientAddress({
    deploymentEnvironment: 'production',
    configuredHeader: 'x-client-supplied-ip',
    getHeader: headers({ 'x-client-supplied-ip': '203.0.113.9' })
  }), 'unavailable');

  assert.equal(resolveClientAddress({
    deploymentEnvironment: 'production',
    configuredHeader: 'x-forwarded-for',
    getHeader: headers({ 'x-forwarded-for': 'attacker-controlled-value' })
  }), 'unavailable');
});

test('preview/development preserve a bounded local fallback for engineering flows', () => {
  assert.equal(resolveClientAddress({
    deploymentEnvironment: 'preview',
    getHeader: headers({ 'x-forwarded-for': '192.0.2.10, 10.0.0.1' })
  }), '192.0.2.10');

  assert.equal(resolveClientAddress({
    deploymentEnvironment: 'development',
    getHeader: headers({ 'x-real-ip': '127.0.0.1' })
  }), '127.0.0.1');
});

test('allowed client header set is finite and reviewable', () => {
  assert.deepEqual(ALLOWED_CLIENT_IP_HEADERS, [
    'cf-connecting-ip',
    'x-vercel-forwarded-for',
    'x-forwarded-for',
    'x-real-ip',
    'fly-client-ip'
  ]);
});
