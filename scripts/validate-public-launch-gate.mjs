import fs from 'node:fs';

const gate = JSON.parse(fs.readFileSync('data/release/public-launch-gate-v0.1-dev.json','utf8'));
const requirements = fs.readFileSync('REQUIREMENTS.md','utf8');
const lines = requirements.split('\n');
const errors=[];

function requirementChecked(id) {
  const line = lines.find((value) => value.includes(`**${id}**`));
  if (!line) throw new Error(`Master requirement not found: ${id}`);
  return line.startsWith('- [x]');
}

function phaseChecked(label) {
  const line = lines.find((value) => value.startsWith('- [') && value.includes(label));
  if (!line) throw new Error(`Phase gate not found: ${label}`);
  return line.startsWith('- [x]');
}

if (gate.gate_version !== 'public-launch-gate-v0.1-dev') errors.push('unexpected launch gate version');
if (gate.public_launch_ready !== false || gate.status !== 'blocked') errors.push('current development launch gate must remain blocked');
if (gate.launch_actions.announce_v1_allowed !== false) errors.push('v1 announcement must remain blocked');
if (gate.launch_actions.enable_public_indexing_allowed !== false) errors.push('public indexing must remain blocked');
if (gate.launch_actions.claim_validated_allowed !== false) errors.push('validated claim must remain blocked');
if (gate.launch_actions.publish_population_rarity_allowed !== false) errors.push('population rarity publication must remain blocked');

const incompleteRequirements=gate.required_master_requirements.filter((id)=>!requirementChecked(id));
const incompletePhases=gate.required_phase_gates.filter((label)=>!phaseChecked(label));
const pendingExternal=Object.entries(gate.external_manual_evidence).filter(([,status])=>status!=='complete').map(([key])=>key);

if (incompleteRequirements.length===0) errors.push('launch gate blocker list unexpectedly has no incomplete master requirements; review whether gate should advance');
if (incompletePhases.length===0) errors.push('launch gate blocker list unexpectedly has no incomplete phase gates; review whether gate should advance');
if (pendingExternal.length===0) errors.push('launch gate external/manual evidence unexpectedly all complete; gate state must be reviewed');

const ops006 = lines.find((value) => value.includes('**PCS-OPS-006**'));
if (!ops006 || !ops006.startsWith('- [ ]')) errors.push('PCS-OPS-006 must remain open while public_launch_ready=false');

if (errors.length) {
  console.error(`Public launch gate validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  gate_version:gate.gate_version,
  public_launch_ready:false,
  incomplete_master_requirements:incompleteRequirements,
  incomplete_phase_gates:incompletePhases,
  pending_external_manual_evidence:pendingExternal
},null,2));
