import fs from 'node:fs';

const review=JSON.parse(fs.readFileSync('data/security/security-privacy-release-review-v0.1-dev.json','utf8'));
const env=JSON.parse(fs.readFileSync('data/operations/environment-contract-v0.1-dev.json','utf8'));
const requirements=fs.readFileSync('REQUIREMENTS.md','utf8');
const errors=[];

if (review.review_version !== 'security-privacy-release-review-v0.1-dev') errors.push('unexpected release review version');
if (review.release_ready !== false) errors.push('security/privacy release readiness must remain false until manual/deployment evidence exists');
for (const [name,status] of Object.entries(review.automated_controls)) { if (status !== 'complete') errors.push(`automated control must remain complete or fail CI: ${name}`); }
const pending=Object.entries(review.deployment_manual_controls).filter(([,status])=>status!=='complete').map(([name])=>name);
if (pending.length === 0) errors.push('manual/deployment controls unexpectedly all complete; review gate state before changing release_ready');
if (!pending.includes('trusted_proxy_forwarded_header_sanitization')) errors.push('trusted proxy evidence must remain explicit');
if (!pending.includes('production_database_least_privilege')) errors.push('DB least privilege evidence must remain explicit');
if (!pending.includes('deployment_secret_store_evidence')) errors.push('secret-store evidence must remain explicit');
if (!pending.includes('external_security_review')) errors.push('external security review must remain explicit');
if (env.repository_proves_deployed_environment_separation !== false) errors.push('environment contract must not pretend deployment separation is proven');
const qaLine=requirements.split('\n').find((line)=>line.includes('**PCS-QA-007**'));
if (!qaLine || !qaLine.startsWith('- [ ]')) errors.push('PCS-QA-007 must remain open while release_ready=false');

if (errors.length) {
 console.error(`Security/privacy release review validation failed with ${errors.length} error(s):`);
 for (const error of errors) console.error(`- ${error}`);
 process.exit(1);
}
console.log(JSON.stringify({review_version:review.review_version,release_ready:false,pending_manual_deployment_controls:pending},null,2));
