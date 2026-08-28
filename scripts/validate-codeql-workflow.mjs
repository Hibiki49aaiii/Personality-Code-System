import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/codeql.yml','utf8');
const errors=[];

for (const fragment of [
  'name: CodeQL',
  'pull_request:',
  'schedule:',
  'security-events: write',
  'github/codeql-action/init@v3',
  'github/codeql-action/analyze@v3',
  'languages: javascript-typescript',
  'queries: security-extended'
]) {
  if (!workflow.includes(fragment)) errors.push(`CodeQL workflow missing ${fragment}`);
}
if (!workflow.includes("cron: '23 3 * * 1'")) errors.push('CodeQL weekly schedule drift');
if (!workflow.includes('branches: [main]')) errors.push('CodeQL main-branch trigger missing');

if (errors.length) {
  console.error(`CodeQL workflow contract validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('CodeQL workflow contract validation passed: JS/TS extended security queries run on main, PRs and weekly schedule with security-events permission.');
