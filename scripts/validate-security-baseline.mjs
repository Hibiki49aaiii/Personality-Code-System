import fs from 'node:fs';

const policy = JSON.parse(
  fs.readFileSync('data/security/rate-limits-v0.1-dev.json', 'utf8')
);
const nextConfig = fs.readFileSync('next.config.ts', 'utf8');
const errors = [];

if (policy.rate_limit_policy_version !== 'rate-limits-v0.1-dev') {
  errors.push('unexpected rate limit policy version');
}
if (policy.principal_storage !== 'hmac-sha256') {
  errors.push('rate limit principals must use hmac-sha256 storage');
}

const expectedScopes = {
  'assessment-session-create': { principal: 'ip' },
  'assessment-answer': { principal: 'session' },
  'assessment-complete': { principal: 'session' },
  'share-mutation': { principal: 'session' },
  'data-deletion': { principal: 'session' },
  analytics: { principal: 'session-or-ip' }
};

for (const [scope, expected] of Object.entries(expectedScopes)) {
  const definition = policy.scopes?.[scope];
  if (!definition) {
    errors.push(`missing rate limit scope ${scope}`);
    continue;
  }
  if (definition.principal !== expected.principal) {
    errors.push(`${scope}: expected principal ${expected.principal}`);
  }
  if (!Number.isInteger(definition.window_seconds) || definition.window_seconds < 1 || definition.window_seconds > 86400) {
    errors.push(`${scope}: invalid window_seconds`);
  }
  if (!Number.isInteger(definition.max_requests) || definition.max_requests < 1 || definition.max_requests > 1000000) {
    errors.push(`${scope}: invalid max_requests`);
  }
}

for (const scope of Object.keys(policy.scopes ?? {})) {
  if (!(scope in expectedScopes)) errors.push(`unexpected rate limit scope ${scope}`);
}

const guardedMutationRoutes = {
  'src/app/api/analytics/route.ts': 1,
  'src/app/api/assessment/session/route.ts': 1,
  'src/app/api/assessment/answer/route.ts': 1,
  'src/app/api/assessment/complete/route.ts': 1,
  'src/app/api/assessment/data/route.ts': 1,
  'src/app/api/share/route.ts': 2
};

for (const [routeFile, expectedMutationCount] of Object.entries(guardedMutationRoutes)) {
  if (!fs.existsSync(routeFile)) {
    errors.push(`missing guarded mutation route ${routeFile}`);
    continue;
  }

  const routeSource = fs.readFileSync(routeFile, 'utf8');
  const mutationCount = (routeSource.match(/export async function (?:POST|PUT|PATCH|DELETE)\s*\(/g) ?? []).length;
  const guardCount = (routeSource.match(/assertTrustedMutationRequest\(request\)/g) ?? []).length;

  if (mutationCount !== expectedMutationCount) {
    errors.push(`${routeFile}: expected ${expectedMutationCount} state-changing handler(s), found ${mutationCount}; review the CSRF guard contract`);
  }
  if (guardCount !== expectedMutationCount) {
    errors.push(`${routeFile}: expected ${expectedMutationCount} trusted-mutation guard call(s), found ${guardCount}`);
  }
}

for (const requiredHeaderFragment of [
  'Content-Security-Policy',
  "default-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "connect-src 'self'",
  'X-Frame-Options',
  'X-Content-Type-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Strict-Transport-Security'
]) {
  if (!nextConfig.includes(requiredHeaderFragment)) {
    errors.push(`next.config.ts missing security header contract: ${requiredHeaderFragment}`);
  }
}

if (!nextConfig.includes('max-age=31536000; includeSubDomains')) {
  errors.push('HSTS one-year includeSubDomains baseline is missing');
}
if (!nextConfig.includes('camera=(), microphone=(), geolocation=(), payment=(), usb=()')) {
  errors.push('Permissions-Policy baseline is missing');
}

if (errors.length) {
  console.error(`Security baseline validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Security baseline validation passed: ${Object.keys(expectedScopes).length} HMAC rate-limit scopes, ${Object.keys(guardedMutationRoutes).length} guarded mutation route files, and CSP/browser hardening headers.`);
