export type ClientProductEventProperties = Record<string, string | number | boolean>;

export async function sendClientProductEvent(
  name: string,
  properties: ClientProductEventProperties = {}
): Promise<void> {
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      cache: 'no-store',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ name, properties })
    });
  } catch {
    // Product analytics is non-essential and must never block the user flow.
  }
}

export function viewportCategory(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  if (window.innerWidth < 768) return 'mobile';
  if (window.innerWidth < 1024) return 'tablet';
  return 'desktop';
}
