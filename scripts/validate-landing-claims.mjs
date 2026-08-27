import fs from 'node:fs';

const source = fs.readFileSync('src/app/page.tsx', 'utf8');
const errors = [];

const requiredFragments = [
  'これは医療・臨床診断ではありません。',
  '現在のCore Codeは開発中',
  '心理学上の固定分類や科学的妥当性を主張するものではありません。',
  'C01D / NON-PUBLIC',
  'MODEL STATUS — DEVELOPMENT / NOT VALIDATED'
];

for (const fragment of requiredFragments) {
  if (!source.includes(fragment)) errors.push(`landing page missing required claim boundary: ${fragment}`);
}

const forbiddenPatterns = [
  [/科学的に証明/u, 'scientific proof claim'],
  [/科学的に検証済み/u, 'validated claim'],
  [/診断精度\s*\d+%/u, 'unsupported accuracy percentage'],
  [/人口の\s*\d+(?:\.\d+)?%/u, 'unsupported population rarity'],
  [/CORE TYPE\s*01\s*\/\s*64/u, 'finalized 64-type ordinal presentation'],
  [/AVX[—-]COS/u, 'obsolete sample code']
];

for (const [pattern, label] of forbiddenPatterns) {
  if (pattern.test(source)) errors.push(`landing page contains prohibited/obsolete claim presentation: ${label}`);
}

if (!source.includes('診断を試す') || !source.includes('傾向を連続値で測定')) {
  errors.push('landing page must explain assessment purpose and provide a diagnosis entry point');
}

if (errors.length) {
  console.error(`Landing claim validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Landing claim validation passed: purpose, non-clinical boundary, development/non-validation status, and obsolete/fabricated claim guards verified.');
