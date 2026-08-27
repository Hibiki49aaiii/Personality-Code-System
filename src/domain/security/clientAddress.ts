export type ClientAddressEnvironment = 'development' | 'preview' | 'production';

export const ALLOWED_CLIENT_IP_HEADERS = [
  'cf-connecting-ip',
  'x-vercel-forwarded-for',
  'x-forwarded-for',
  'x-real-ip',
  'fly-client-ip'
] as const;

export type AllowedClientIpHeader = (typeof ALLOWED_CLIENT_IP_HEADERS)[number];

interface ResolveClientAddressInput {
  deploymentEnvironment: ClientAddressEnvironment;
  configuredHeader?: string;
  getHeader: (name: string) => string | null;
}

function normalizeHeaderName(value: string | undefined): AllowedClientIpHeader | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  return (ALLOWED_CLIENT_IP_HEADERS as readonly string[]).includes(normalized)
    ? normalized as AllowedClientIpHeader
    : null;
}

function sanitizeCandidate(value: string | null): string | null {
  const first = value?.split(',')[0]?.trim();
  if (!first || first.length > 128) return null;

  // Rate-limit principals need a bounded, IP-shaped stable value. Full network
  // trust is deliberately a deployment concern; arbitrary header text is rejected.
  if (!/^[0-9a-f:.%]+$/i.test(first)) return null;
  if (!first.includes('.') && !first.includes(':')) return null;
  return first.toLowerCase();
}

export function resolveClientAddress(input: ResolveClientAddressInput): string {
  const configured = normalizeHeaderName(input.configuredHeader);

  if (input.deploymentEnvironment === 'production') {
    // Production never guesses which forwarded header is trustworthy. The edge/CDN
    // must be configured to overwrite one explicitly selected header.
    if (!configured) return 'unavailable';
    return sanitizeCandidate(input.getHeader(configured)) ?? 'unavailable';
  }

  if (configured) {
    return sanitizeCandidate(input.getHeader(configured)) ?? 'unavailable';
  }

  return (
    sanitizeCandidate(input.getHeader('x-forwarded-for')) ??
    sanitizeCandidate(input.getHeader('x-real-ip')) ??
    'unavailable'
  );
}
