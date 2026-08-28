import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDeploymentProbe } from '../../scripts/lib/deployment-probe.mjs';

const headers={
  'content-security-policy':"default-src 'self'; frame-ancestors 'none'; object-src 'none'",
  'x-frame-options':'DENY',
  'x-content-type-options':'nosniff',
  'referrer-policy':'strict-origin-when-cross-origin',
  'permissions-policy':'camera=(), microphone=(), geolocation=()'
};

function fixture(overrides={}) {
  return {
    baseUrl:'http://127.0.0.1:3000',
    environment:'preview',
    mode:'prelaunch',
    health:{
      status:200,
      json:{status:'ok'},
      text:'{"status":"ok"}',
      headers:{'cache-control':'no-store, max-age=0','x-robots-tag':'noindex, nofollow'}
    },
    landing:{
      status:200,
      text:'<html><head><meta name="robots" content="noindex,nofollow"></head></html>',
      headers:{...headers}
    },
    robots:{status:200,text:'User-agent: *\nDisallow: /\n',headers:{}},
    ...overrides
  };
}

test('preview prelaunch probe passes reviewed fail-closed boundaries',()=>{
  const report=evaluateDeploymentProbe(fixture());
  assert.equal(report.passed,true);
  assert.ok(report.checks.every((entry)=>entry.passed));
});

test('production requires HTTPS and HSTS',()=>{
  const bad=evaluateDeploymentProbe(fixture({environment:'production'}));
  assert.equal(bad.passed,false);
  assert.equal(bad.checks.find((c)=>c.name==='origin-protocol')?.passed,false);
  assert.equal(bad.checks.find((c)=>c.name==='hsts')?.passed,false);

  const goodFixture=fixture({
    baseUrl:'https://pcs.example',
    environment:'production'
  });
  goodFixture.landing.headers['strict-transport-security']='max-age=31536000; includeSubDomains';
  const good=evaluateDeploymentProbe(goodFixture);
  assert.equal(good.passed,true);
});

test('prelaunch probe fails if crawler boundary is opened',()=>{
  const f=fixture();
  f.robots.text='User-agent: *\nAllow: /\n';
  f.landing.text='<html><head></head></html>';
  const report=evaluateDeploymentProbe(f);
  assert.equal(report.passed,false);
  assert.equal(report.checks.find((c)=>c.name==='robots-prelaunch-disallow')?.passed,false);
  assert.equal(report.checks.find((c)=>c.name==='html-prelaunch-noindex')?.passed,false);
});

test('public mode rejects stale noindex/disallow-all state',()=>{
  const report=evaluateDeploymentProbe(fixture({mode:'public'}));
  assert.equal(report.passed,false);
  assert.equal(report.checks.find((c)=>c.name==='html-public-indexable')?.passed,false);
});
