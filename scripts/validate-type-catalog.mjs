import fs from 'node:fs';

const codeSchema = JSON.parse(fs.readFileSync('data/code-schema/v0.1-dev.json', 'utf8'));
const reachability = JSON.parse(
  fs.readFileSync('data/type-catalog/v0.1-dev/reachability.json', 'utf8')
);
const scaffold = JSON.parse(
  fs.readFileSync('data/type-catalog/v0.1-dev/editorial-scaffold.json', 'utf8')
);

const errors = [];

const archetypes = Object.freeze({
  LTG: '協調実務者',
  LTA: '自律実務者',
  LVG: '検証運用者',
  LVA: '独立検証者',
  STG: '協調設計者',
  STA: '自律設計者',
  SVG: '検証設計者',
  SVA: '自律検証設計者'
});
const actionModes = Object.freeze({
  PF: '準備深化',
  PN: '探索構想',
  EF: '実行深化',
  EN: '開拓実行'
});
const relationModes = Object.freeze({ B: '広がり', D: '深度' });

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

function neighborsFor(code) {
  return axes.map((axis, position) => {
    const chars = code.split('');
    chars[position] = chars[position] === axis.low_symbol ? axis.high_symbol : axis.low_symbol;
    return chars.join('');
  });
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

  const neighbors = neighborsFor(code);
  if (new Set(neighbors).size !== axes.length || neighbors.some((neighbor) => !actualSet.has(neighbor))) {
    errors.push(`${code} does not resolve to exactly ${axes.length} valid one-axis neighbors`);
  }
}

if (scaffold.catalog_version !== reachability.catalog_version) {
  errors.push(`Scaffold catalog_version ${scaffold.catalog_version} does not match reachability manifest`);
}
if (scaffold.naming_system_version !== 'type-naming-v0.1-dev') {
  errors.push(`Unexpected naming_system_version: ${scaffold.naming_system_version}`);
}
if (scaffold.code_schema_version !== codeSchema.code_schema_version || scaffold.schema_token !== codeSchema.schema_token) {
  errors.push('Editorial scaffold code-schema metadata does not match C01D source schema');
}
if (scaffold.locale !== reachability.locale) {
  errors.push(`Editorial scaffold locale ${scaffold.locale} does not match ${reachability.locale}`);
}
if (scaffold.status !== 'draft-editorial-scaffold' || scaffold.public_use !== false) {
  errors.push('Editorial scaffold must remain draft-editorial-scaffold and public_use=false');
}

const entries = Array.isArray(scaffold.entries) ? scaffold.entries : [];
if (scaffold.entry_count !== expectedCount || entries.length !== expectedCount) {
  errors.push(`Editorial scaffold must contain exactly ${expectedCount} entries`);
}

const typeIds = new Set();
const titles = new Set();
for (let index = 0; index < entries.length; index += 1) {
  const entry = entries[index];
  const code = expectedCodes[index];
  if (entry.core_code !== code) {
    errors.push(`Editorial scaffold order drift at index ${index}: expected ${code}, got ${entry.core_code}`);
    continue;
  }
  const expectedTypeId = `${codeSchema.schema_token}-${code}`;
  if (entry.type_id !== expectedTypeId) errors.push(`${code}: expected type_id ${expectedTypeId}, got ${entry.type_id}`);
  if (typeIds.has(entry.type_id)) errors.push(`Duplicate type_id ${entry.type_id}`);
  typeIds.add(entry.type_id);

  if (entry.status !== 'draft-structural-title') {
    errors.push(`${code}: structural entry status must remain draft-structural-title`);
  }

  const expectedArchetype = archetypes[code.slice(0, 3)];
  const expectedActionMode = actionModes[code.slice(3, 5)];
  const expectedRelationMode = relationModes[code[5]];
  const expectedTitle = `${expectedRelationMode}・${expectedActionMode}型 ${expectedArchetype}`;

  if (entry.formal_draft_title_ja !== expectedTitle) {
    errors.push(`${code}: structural title mismatch; expected ${expectedTitle}, got ${entry.formal_draft_title_ja}`);
  }
  if (titles.has(entry.formal_draft_title_ja)) {
    errors.push(`Duplicate formal_draft_title_ja ${entry.formal_draft_title_ja}`);
  }
  titles.add(entry.formal_draft_title_ja);

  if (entry.title_parts?.relation_mode !== expectedRelationMode) {
    errors.push(`${code}: relation_mode does not match RDP symbol`);
  }
  if (entry.title_parts?.action_exploration_mode !== expectedActionMode) {
    errors.push(`${code}: action_exploration_mode does not match EXE/NOV symbols`);
  }
  if (entry.title_parts?.cognitive_governance_archetype !== expectedArchetype) {
    errors.push(`${code}: cognitive_governance_archetype does not match SYS/VER/AUT symbols`);
  }

  const expectedProvenance = [...code].map((symbol, position) => `core-axis:${position + 1}:${symbol}`);
  if (JSON.stringify(entry.title_provenance) !== JSON.stringify(expectedProvenance)) {
    errors.push(`${code}: title_provenance must cover all six axes in canonical order`);
  }

  const expectedNeighbors = neighborsFor(code);
  if (JSON.stringify(entry.neighbor_codes) !== JSON.stringify(expectedNeighbors)) {
    errors.push(`${code}: neighbor_codes do not match the six one-axis flips in canonical axis order`);
  }

  if (!entry.editorial || typeof entry.editorial !== 'object') {
    errors.push(`${code}: missing editorial object`);
  } else {
    for (const field of ['public_name_ja', 'identity_sentence_ja', 'overview_ja']) {
      const value = entry.editorial[field];
      if (value !== null && (typeof value !== 'string' || value.trim().length === 0)) {
        errors.push(`${code}: editorial.${field} must be null or a non-empty string`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error('Type catalog validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Type catalog validation passed: ${actualCodes.length} reachable ${codeSchema.schema_token} codes, ${titles.size} traceable structural titles, six-neighbor closure; catalog remains draft and non-public.`
);
