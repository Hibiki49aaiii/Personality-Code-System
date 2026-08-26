const DEVELOPMENT_ORIGIN = 'http://localhost:3000';

export function getSiteOrigin(): URL {
  const configured = process.env.PCS_SITE_ORIGIN ?? process.env.NEXT_PUBLIC_SITE_ORIGIN ?? DEVELOPMENT_ORIGIN;
  const url = new URL(configured);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('PCS_SITE_ORIGIN must use http or https');
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('PCS_SITE_ORIGIN must be a clean site origin without credentials/query/hash');
  }

  url.pathname = '/';
  return url;
}
