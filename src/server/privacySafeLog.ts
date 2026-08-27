export type ServerFaultSurface =
  | 'assessment'
  | 'analytics'
  | 'public-share'
  | 'health'
  | 'release';

export type ServerFaultCategory =
  | 'unexpected'
  | 'persistence'
  | 'render'
  | 'readiness'
  | 'release-blocked';

export function logPrivacySafeServerFault(input: {
  surface: ServerFaultSurface;
  category: ServerFaultCategory;
}): void {
  // Deliberately fixed-schema. Never accept Error, request, token, answer,
  // trait/result payload, URL, headers, cookies, free text, or stack data.
  console.error(JSON.stringify({
    event: 'pcs_server_fault',
    surface: input.surface,
    category: input.category
  }));
}
