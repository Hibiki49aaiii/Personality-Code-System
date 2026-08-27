const DEVELOPMENT_ORIGIN = 'http://localhost:3000';

export function getSiteOrigin(): URL {
  const deploymentEnvironment = process.env.PCS_DEPLOYMENT_ENV;
  const configured = process.env.PCS_SITE_ORIGIN;

  if (
    !configured &&
    (deploymentEnvironment === 'preview' || deploymentEnvironment === 'production')
  ) {
    throw new Error('PCS_SITE_ORIGIN is required in preview and production environments');
  }

  const url = new URL(configured ?? DEVELOPMENT_ORIGIN);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('PCS_SITE_ORIGIN must use http or https');
  }
  if (deploymentEnvironment === 'production' && url.protocol !== 'https:') {
    throw new Error('PCS_SITE_ORIGIN must use https in production');
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('PCS_SITE_ORIGIN must be a clean site origin without credentials/query/hash');
  }

  url.pathname = '/';
  return url;
}
