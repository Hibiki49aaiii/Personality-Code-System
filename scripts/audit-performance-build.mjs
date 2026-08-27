import fs from 'node:fs';
import path from 'node:path';

const budget = JSON.parse(fs.readFileSync('data/performance/budgets-v0.1-dev.json', 'utf8'));
const staticRoot = '.next/static';

if (!fs.existsSync(staticRoot)) {
  throw new Error('.next/static is required; run the production build before the performance budget audit');
}

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function bytes(files) {
  return files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
}

function largest(files) {
  return files.reduce((max, file) => Math.max(max, fs.statSync(file).size), 0);
}

const files = walk(staticRoot);
const js = files.filter((file) => file.endsWith('.js'));
const css = files.filter((file) => file.endsWith('.css'));
const sourceMaps = files.filter((file) => file.endsWith('.map'));
const limits = budget.production_build_artifacts;
const errors = [];

const measurements = {
  client_static_js_total_bytes: bytes(js),
  client_static_js_single_file_bytes: largest(js),
  client_static_css_total_bytes: bytes(css),
  client_static_css_single_file_bytes: largest(css),
  client_static_all_files_total_bytes: bytes(files),
  client_static_single_file_bytes: largest(files)
};

for (const [measurement, value] of Object.entries(measurements)) {
  const limitKey = `${measurement}_max`;
  const limit = limits[limitKey];
  if (!Number.isInteger(limit) || limit <= 0) {
    errors.push(`missing/invalid budget ${limitKey}`);
    continue;
  }
  if (value > limit) errors.push(`${measurement}=${value} exceeds ${limitKey}=${limit}`);
}

if (budget.policy.browser_source_maps_allowed !== false) {
  errors.push('browser source-map policy must remain false');
}
if (sourceMaps.length > 0) {
  errors.push(`browser source maps found: ${sourceMaps.slice(0, 5).join(', ')}`);
}
if (budget.policy.runtime_ai_dependencies_allowed !== false) {
  errors.push('runtime AI dependency performance policy must remain false');
}
if (budget.field_core_web_vitals.aggregation_percentile !== 75) {
  errors.push('Core Web Vitals field target must remain recorded at the 75th percentile');
}

const good = budget.field_core_web_vitals.good_thresholds;
if (good.LCP_ms !== 2500 || good.INP_ms !== 200 || good.CLS !== 0.1) {
  errors.push('recorded Core Web Vitals good thresholds drifted; require an explicit budget version review');
}

if (errors.length) {
  console.error(`Performance budget audit failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  budget_version: budget.budget_version,
  measurements,
  limits,
  field_cwv_gate: {
    status: 'not-proven-by-build-audit',
    percentile: budget.field_core_web_vitals.aggregation_percentile,
    good_thresholds: budget.field_core_web_vitals.good_thresholds
  }
}, null, 2));
