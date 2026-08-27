import type { NextRequest } from 'next/server';
import policyData from '../../data/security/rate-limits-v0.1-dev.json';
import type { PcsDatabase } from '../infrastructure/persistence/database';
import {
  consumeFixedWindowRateLimit,
  type RateLimitDecision
} from '../infrastructure/persistence/rateLimitRepository';

export type RateLimitScope =
  | 'assessment-session-create'
  | 'assessment-answer'
  | 'assessment-complete'
  | 'share-mutation'
  | 'analytics';

type PrincipalMode = 'ip' | 'session' | 'session-or-ip';

interface RateLimitPolicy {
  window_seconds: number;
  max_requests: number;
  principal: PrincipalMode;
}

interface RateLimitPolicyFile {
  rate_limit_policy_version: string;
  principal_storage: 'hmac-sha256';
  scopes: Record<RateLimitScope, RateLimitPolicy>;
}

const policy = policyData as unknown as RateLimitPolicyFile;

export const RATE_LIMIT_POLICY_VERSION = policy.rate_limit_policy_version;

export class RateLimitExceededError extends Error {
  constructor(
    public readonly scope: RateLimitScope,
    public readonly retryAfterSeconds: number
  ) {
    super('Rate limit exceeded');
    this.name = 'RateLimitExceededError';
  }
}

function requireRateLimitSecret(): string {
  const configured = process.env.PCS_RATE_LIMIT_SECRET;
  if (configured && configured.length >= 32) return configured;

  if (process.env.NODE_ENV !== 'production') {
    return 'pcs-development-only-rate-limit-secret-not-for-production';
  }

  throw new Error('PCS_RATE_LIMIT_SECRET must be configured with at least 32 characters in production');
}

function clientAddress(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const firstForwarded = forwarded?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();
  const candidate = firstForwarded || realIp || 'unknown';

  return candidate.length <= 128 ? candidate : candidate.slice(0, 128);
}

function resolvePrincipal(
  request: NextRequest,
  mode: PrincipalMode,
  privateToken?: string | null
): string {
  if (mode === 'session') {
    if (!privateToken) throw new Error('Rate limit scope requires an assessment session');
    return `session:${privateToken}`;
  }

  if (mode === 'session-or-ip' && privateToken) {
    return `session:${privateToken}`;
  }

  return `ip:${clientAddress(request)}`;
}

export async function applyRateLimit(
  db: PcsDatabase,
  request: NextRequest,
  scope: RateLimitScope,
  privateToken?: string | null
): Promise<RateLimitDecision> {
  const definition = policy.scopes[scope];
  if (!definition) throw new Error(`Unknown rate limit scope ${scope}`);

  const decision = await consumeFixedWindowRateLimit(db, {
    secret: requireRateLimitSecret(),
    scope,
    principal: resolvePrincipal(request, definition.principal, privateToken),
    windowSeconds: definition.window_seconds,
    maxRequests: definition.max_requests
  });

  if (!decision.allowed) {
    throw new RateLimitExceededError(scope, decision.retryAfterSeconds);
  }

  return decision;
}
