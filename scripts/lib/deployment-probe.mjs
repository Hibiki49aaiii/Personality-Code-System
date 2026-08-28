function includesToken(value, token) {
  return String(value ?? '').toLowerCase().includes(token.toLowerCase());
}

function check(name, passed, detail) {
  return { name, passed: Boolean(passed), detail };
}

export function evaluateDeploymentProbe(input) {
  const { baseUrl, environment, mode, health, landing, robots } = input;
  const checks=[];
  const url=new URL(baseUrl);

  checks.push(check(
    'origin-protocol',
    environment!=='production' || url.protocol==='https:',
    environment==='production' ? 'production requires https' : 'preview may use http/https'
  ));
  checks.push(check('health-status',health.status===200,`status=${health.status}`));
  checks.push(check('health-body',health.json?.status==='ok',`body.status=${health.json?.status ?? 'missing'}`));
  checks.push(check('health-no-store',includesToken(health.headers['cache-control'],'no-store'),health.headers['cache-control']??'missing'));
  checks.push(check('health-noindex',includesToken(health.headers['x-robots-tag'],'noindex'),health.headers['x-robots-tag']??'missing'));

  checks.push(check('landing-status',landing.status===200,`status=${landing.status}`));
  checks.push(check('powered-by-hidden',!landing.headers['x-powered-by'],landing.headers['x-powered-by']??'absent'));
  checks.push(check('csp-default-self',includesToken(landing.headers['content-security-policy'],"default-src 'self'"),landing.headers['content-security-policy']??'missing'));
  checks.push(check('csp-frame-none',includesToken(landing.headers['content-security-policy'],"frame-ancestors 'none'"),landing.headers['content-security-policy']??'missing'));
  checks.push(check('frame-deny',String(landing.headers['x-frame-options']??'').toUpperCase()==='DENY',landing.headers['x-frame-options']??'missing'));
  checks.push(check('nosniff',String(landing.headers['x-content-type-options']??'').toLowerCase()==='nosniff',landing.headers['x-content-type-options']??'missing'));
  checks.push(check('referrer-policy',String(landing.headers['referrer-policy']??'').toLowerCase()==='strict-origin-when-cross-origin',landing.headers['referrer-policy']??'missing'));
  checks.push(check('permissions-policy',includesToken(landing.headers['permissions-policy'],'geolocation=()'),landing.headers['permissions-policy']??'missing'));

  if (environment==='production') {
    const hsts=landing.headers['strict-transport-security'];
    checks.push(check('hsts',includesToken(hsts,'max-age=31536000')&&includesToken(hsts,'includesubdomains'),hsts??'missing'));
  }

  checks.push(check('robots-status',robots.status===200,`status=${robots.status}`));
  if (mode==='prelaunch') {
    checks.push(check('robots-prelaunch-disallow',/Disallow:\s*\//i.test(robots.text),'prelaunch must disallow all crawling'));
    checks.push(check('html-prelaunch-noindex',/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(landing.text)||/<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/i.test(landing.text),'prelaunch HTML must include noindex'));
  } else if (mode==='public') {
    checks.push(check('robots-public-not-disallow-all',!/Disallow:\s*\/\s*(?:\r?\n|$)/i.test(robots.text),'public mode must not disallow all'));
    checks.push(check('html-public-indexable',!/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(landing.text),'public HTML must not retain noindex'));
  } else {
    checks.push(check('mode-valid',false,`unsupported mode ${mode}`));
  }

  return {
    probe_version:'deployment-probe-v0.1-dev',
    environment,
    mode,
    base_url:url.origin,
    passed:checks.every((item)=>item.passed),
    checks
  };
}

export function responseHeadersToObject(headers) {
  return Object.fromEntries([...headers.entries()].map(([key,value])=>[key.toLowerCase(),value]));
}
