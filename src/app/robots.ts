import type { MetadataRoute } from 'next';
import { isPublicIndexingAllowed } from '../server/deploymentGate';

export default function robots(): MetadataRoute.Robots {
  if (!isPublicIndexingAllowed()) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }]
    };
  }

  return {
    rules: [{ userAgent: '*', allow: '/' }]
  };
}
