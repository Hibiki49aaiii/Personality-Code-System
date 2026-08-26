import fs from 'node:fs';

const codeSchema = JSON.parse(fs.readFileSync('data/code-schema/v0.1-dev.json', 'utf8'));
const reachability = JSON.parse(
  fs.readFileSync('data/type-catalog/v0.1-dev/reachability.json', 'utf8')
);

const errors = [];

if (reachability.catalog_version !== 'type-catalog-v0.1-dev') {
  errors.push(`Unexpected catalog_version: ${reachability.catalog_version}`);
}
if (reachability.code_schema_version !== codeSchema.code_schema_version) {
  errors.push(
    `Catalog code_schema_version ${reachability.code_schema_version} does not match ${codeSchema.code_schema_version}`
  );
}
if (reachability.schema_token !== codeSchema.schema_token) {
  errors.push(`Catalog schema_token ${reachability.schema_token} does not match ${codeSchema.schema_token}`);
}
if (reachability.locale !== 'ja-JP') {
  errors.push(`Development catalog locale must be ja-JP, got ${reachability.locale}`);
}
if (reachability.status !== 'draft-engineering') {
  errors.push(`Development catalog status must remain draft-engineering, got ${reachability.status}`);
}
if (codeSchema.public_use !== false || reachability.public_use !== false) {
  errors.push('C01D development schema/catalog must remain public_use=false until the public-code gate');
}

if (!Array.isArray(codeSchema.axes) || codeSchema.axes.length === 0) {
  errors.push('Code schema must contain at least one axis');
}

const axes = Array.isArray(codeSchema.axes) ? [...codeSchema.axes].sort((a, b) => a.position - b.position) : [];
for (let index = 0; index < axes.length; index += 1) {
  const axis = axes[index];
  if (axis.position !== index + 1) {
    errors.push(`Axis positions must be contiguous from 1; found ${axis.position} at index ${index}`);
  }
  if (
    typeof axis.high_symbol !== 'string' ||
    typeof axis.low_symbol !== 'string' ||
    axis.high_symbol.length !== 1 ||
    axis.low_symbol.length !== 1 ||
    axis.high_symbol === axis.low_symbol
  ) {
    errors.push(`Axis ${axis.position} must define distinct one-character high/low symbols`);
  }
}

function enumerateCodes(index = 0, prefix = '', output = []) {
  if (index === axes.length) {
    output.push(prefix);
    return output;
  }
  const axis = axes[index];
  enumerateCodes(index + 1, prefix + axis.low_symbol, output);
  enumerateCodes(index + 1, prefix + axis.high_symbol, output);
  return output;
}

const expectedCodes = enumerateCodes();
const expectedCount = 2 ** axes.length;
const actualCodes = Array.isArray(reachability.core_codes) ? reachability.core_codes : [];

if (reachability.expected_type_count !== expectedCount) {
  errors.push(
    `expected_type_count must equal 2^axes (${expectedCount}), got ${reachability.expected_type_count}`
  );
}
if (actualCodes.length !== expectedCount) {
  errors.push(`Catalog contains ${actualCodes.length} codes; expected ${expectedCount}`);
}

const uniqueCodes = new Set(actualCodes);
if (uniqueCodes.size !== actualCodes.length) {
  errors.push('Catalog contains duplicate Core Codes');
}

for (const code of actualCodes) {
  if (typeof code !== 'string' || code.length !== axes.length) {
    errors.push(`Invalid Core Code shape: ${String(code)}`);
    continue;
  }
  for (let position = 0; position < axes.length; position += 1) {
    const axis = axes[position];
    if (code[position] !== axis.low_symbol && code[position] !== axis.high_symbol) {
      errors.push(`Impossible symbol ${code[position]} at position ${position + 1} in ${code}`);
    }
  }
}

for (let index = 0; index < expectedCodes.length; index += 1) {
  if (actualCodes[index] !== expectedCodes[index]) {
    errors.push(
      `Canonical reachability order drift at index ${index}: expected ${expectedCodes[index]}, got ${actualCodes[index]}`
    );
    break;
  }
}

const actualSet = new Set(actualCodes);
for (const code of expectedCodes) {
  if (!actualSet.has(code)) errors.push(`Missing reachable Core Code ${code}`);

  const neighbors = [];
  for (let position = 0; position < axes.length; position += 1) {
    const chars = code.split('');
    const axis = axes[position];
    chars[position] = chars[position] === axis.low_symbol ? axis.high_symbol : axis.low_symbol;
    neighbors.push(chars.join(''));
  }

  if (new Set(neighbors).size !== axes.length || neighbors.some((neighbor) => !actualSet.has(neighbor))) {
    errors.push(`${code} does not resolve to exactly ${axes.length} valid one-axis neighbors`);
  }
}

if (errors.length > 0) {
  console.error('Type catalog validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Type catalog validation passed: ${actualCodes.length} reachable ${codeSchema.schema_token} codes / ${axes.length} axes; catalog remains draft and non-public.`
);
