import fs from 'node:fs';

const manifest=JSON.parse(fs.readFileSync('data/illustration/v0.1-dev/fallback-asset.json','utf8'));
const constantSource=fs.readFileSync('src/domain/illustration/fallbackAsset.ts','utf8');
const componentSource=fs.readFileSync(manifest.source_ref,'utf8');
const errors=[];

if (manifest.asset_version !== 'ILL-PCS-FALLBACK-HERO-v01') errors.push('fallback asset version drift');
if (manifest.status !== 'approved-development-fallback') errors.push('fallback must remain explicit development fallback');
if (manifest.curated !== true || manifest.runtime_generation !== false) errors.push('fallback must be curated and non-generated at runtime');
if (manifest.type_specific !== false) errors.push('generic fallback must not pretend to be type-specific');
if (manifest.public_use !== false) errors.push('development fallback public_use must remain false');
if (!constantSource.includes(manifest.asset_version)) errors.push('runtime asset version constant mismatch');
if (!componentSource.includes('data-asset-version={DEVELOPMENT_FALLBACK_ILLUSTRATION_ASSET_VERSION}')) errors.push('fallback component must expose exact version identity');
for (const forbidden of ['Math.random','Date.now','fetch(','openai','anthropic','generative']) {
  if (componentSource.toLowerCase().includes(forbidden.toLowerCase())) errors.push(`fallback component contains forbidden dynamic/generative primitive ${forbidden}`);
}
for (const usage of ['private-result','public-share-page','share-og','share-portrait']) {
  if (!manifest.required_usages.includes(usage)) errors.push(`missing required fallback usage ${usage}`);
}

if (errors.length) {
  console.error(`Fallback illustration validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Fallback illustration validation passed: curated versioned static vector identity is fixed and runtime generation is prohibited.');
