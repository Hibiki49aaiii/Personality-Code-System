import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const contract=JSON.parse(fs.readFileSync('data/release/release-evidence-contract-v0.1-dev.json','utf8'));
const release=JSON.parse(fs.readFileSync('data/release/assessment-dev-v0.3.json','utf8'));
const code=JSON.parse(fs.readFileSync('data/code-schema/v0.1-dev.json','utf8'));
const launch=JSON.parse(fs.readFileSync('data/release/public-launch-gate-v0.1-dev.json','utf8'));
const activation=JSON.parse(fs.readFileSync('data/release/production-model-activation-gate-v0.1-dev.json','utf8'));
const evidence=JSON.parse(fs.readFileSync('data/release/production-evidence-registry-v0.1-dev.json','utf8'));
const illustrations=JSON.parse(fs.readFileSync('data/illustration/v0.1-dev/asset-production-registry.json','utf8'));
const editorialReview=JSON.parse(fs.readFileSync('data/type-catalog/v0.1-dev/editorial-review-ledger.ja.json','utf8'));
const requirements=fs.readFileSync('REQUIREMENTS.md','utf8');

const sha=(bytes)=>crypto.createHash('sha256').update(bytes).digest('hex');
const inspect=(file)=>{
  const bytes=fs.readFileSync(file);
  return { path:file, bytes:bytes.length, sha256:sha(bytes) };
};

const identityFiles=contract.required_identity_files.map(inspect);
const migrationFiles=fs.readdirSync('drizzle')
  .filter((name)=>/^\d+_.*\.sql$/i.test(name))
  .sort()
  .map((name)=>inspect(path.posix.join('drizzle',name)));

const migrationAggregate=sha(Buffer.from(
  migrationFiles.map((file)=>`${file.path}\0${file.sha256}\n`).join(''),
  'utf8'
));

const sourceCommit=(process.env.GITHUB_SHA || execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'})).trim();
if (!/^[a-f0-9]{40}$/i.test(sourceCommit)) throw new Error('release evidence source commit must be a full Git SHA');

const requirementsVersion=requirements.match(/^> Version:\s*([^\s]+)$/m)?.[1];
if (!requirementsVersion) throw new Error('REQUIREMENTS version missing');

const requirementLines=requirements.split('\n');
const masterChecked=(id)=>{
  const line=requirementLines.find((value)=>value.includes(`**${id}**`));
  return Boolean(line?.startsWith('- [x]'));
};
const phaseChecked=(label)=>{
  const line=requirementLines.find((value)=>value.startsWith('- [')&&value.includes(label));
  return Boolean(line?.startsWith('- [x]'));
};
const incompleteMasterRequirements=launch.required_master_requirements.filter((id)=>!masterChecked(id));
const incompletePhaseGates=launch.required_phase_gates.filter((label)=>!phaseChecked(label));

const illustrationProductionCounts=Object.fromEntries(
  contract.status
    ? ['unproduced','draft','review-required','approved','rejected','superseded'].map((status)=>[
        status,
        illustrations.entries.filter((entry)=>entry.status===status).length
      ])
    : []
);

const pack={
  release_evidence_pack_version:contract.release_evidence_contract_version,
  generated_at:new Date().toISOString(),
  source_commit:sourceCommit,
  github_run_id:process.env.GITHUB_RUN_ID ?? null,
  github_run_attempt:process.env.GITHUB_RUN_ATTEMPT ?? null,
  github_workflow:process.env.GITHUB_WORKFLOW ?? null,
  requirements_version:requirementsVersion,
  candidate_model_version:release.model_version,
  candidate_version_tuple:{...release.versions},
  code_schema_public_use:code.public_use,
  public_launch_ready:launch.public_launch_ready,
  production_activation_allowed:activation.production_activation_allowed,
  pending_production_evidence:evidence.entries.filter((entry)=>entry.status!=='complete').map((entry)=>entry.evidence_id),
  incomplete_master_requirements:incompleteMasterRequirements,
  incomplete_phase_gates:incompletePhaseGates,
  canonical_evidence_status_counts:{
    pending:evidence.entries.filter((entry)=>entry.status==='pending').length,
    complete:evidence.entries.filter((entry)=>entry.status==='complete').length
  },
  editorial_review_counts:{
    pending:editorialReview.entries.filter((entry)=>entry.status==='pending').length,
    approved:editorialReview.entries.filter((entry)=>entry.status==='approved').length,
    changes_required:editorialReview.entries.filter((entry)=>entry.status==='changes-required').length
  },
  illustration_production_counts:illustrationProductionCounts,
  identity_files:identityFiles,
  migration_set:{
    file_count:migrationFiles.length,
    aggregate_sha256:migrationAggregate,
    files:migrationFiles
  },
  production_claims:{
    production_deployment_proven:false,
    scientific_validation_proven:false,
    public_taxonomy_approved:false
  }
};

for (const key of contract.required_summary_fields) {
  if (!(key in pack)) throw new Error(`release evidence pack missing required summary field ${key}`);
}

const serialized=JSON.stringify(pack,null,2)+'\n';
const output=path.resolve(contract.output_path);
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,serialized,{mode:0o600});
process.stdout.write(serialized);
