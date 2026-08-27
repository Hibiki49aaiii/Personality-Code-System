import fs from 'node:fs';

const dictionary = JSON.parse(
  fs.readFileSync('data/analytics/event-dictionary-v0.1-dev.json', 'utf8')
);
const retention = JSON.parse(
  fs.readFileSync('data/analytics/retention-policy-v0.1-dev.json', 'utf8')
);
const errors = [];
const allowedSources = new Set(['client', 'server', 'either']);
const allowedScopes = new Set(['none', 'optional', 'required']);
const allowedTypes = new Set(dictionary.allowed_property_types ?? []);
const forbidden = new Set(dictionary.forbidden_property_keys ?? []);

if (dictionary.event_dictionary_version !== 'analytics-events-v0.1-dev') {
  errors.push('unexpected event dictionary version');
}
if (dictionary.transport_policy !== 'first-party-only' || dictionary.third_party_export_default !== false) {
  errors.push('development analytics must remain first-party-only with third-party export disabled by default');
}
if (!Array.isArray(dictionary.events) || dictionary.events.length < 10) {
  errors.push('analytics event dictionary must contain the required product funnel events');
}

if (retention.retention_policy_version !== 'analytics-retention-v0.1-dev') {
  errors.push('unexpected analytics retention policy version');
}
if (
  !Number.isInteger(retention.unscoped_retention_days) ||
  retention.unscoped_retention_days < 1 ||
  retention.unscoped_retention_days > 3650
) {
  errors.push('unscoped analytics retention must be an integer from 1 to 3650 days');
}
if (
  !Number.isInteger(retention.session_bound_retention_days) ||
  retention.session_bound_retention_days < retention.unscoped_retention_days ||
  retention.session_bound_retention_days > 3650
) {
  errors.push('session-bound analytics retention must be >= unscoped retention and <= 3650 days');
}
if (retention.session_delete_behavior !== 'cascade') {
  errors.push('session-bound analytics must cascade-delete with the anonymous session');
}
if (retention.third_party_export_default !== false) {
  errors.push('analytics retention policy must keep third-party export disabled by default');
}

const names = new Set();
for (const event of dictionary.events ?? []) {
  if (!/^[a-z][a-z0-9_]{2,63}$/.test(event.name ?? '')) errors.push(`invalid event name ${event.name}`);
  if (names.has(event.name)) errors.push(`duplicate event ${event.name}`);
  names.add(event.name);
  if (!allowedSources.has(event.source)) errors.push(`${event.name}: invalid source`);
  if (!allowedScopes.has(event.session_scope)) errors.push(`${event.name}: invalid session_scope`);

  const propertyKeys = new Set(Object.keys(event.properties ?? {}));
  if (!Array.isArray(event.required_properties)) {
    errors.push(`${event.name}: required_properties array is required`);
  } else {
    for (const requiredKey of event.required_properties) {
      if (!propertyKeys.has(requiredKey)) errors.push(`${event.name}: required property ${requiredKey} is not defined`);
    }
  }

  for (const [key, spec] of Object.entries(event.properties ?? {})) {
    if (forbidden.has(key)) errors.push(`${event.name}: forbidden analytics property ${key}`);
    if (!/^[A-Za-z][A-Za-z0-9]{1,63}$/.test(key)) errors.push(`${event.name}: invalid property key ${key}`);
    if (!allowedTypes.has(spec.type)) errors.push(`${event.name}.${key}: invalid type ${spec.type}`);
    if (spec.type === 'enum' && (!Array.isArray(spec.values) || spec.values.length < 1)) {
      errors.push(`${event.name}.${key}: enum values required`);
    }
    if (spec.type === 'string' && (!Number.isInteger(spec.max_length) || spec.max_length < 1 || spec.max_length > 256)) {
      errors.push(`${event.name}.${key}: bounded max_length required`);
    }
    if (spec.type === 'integer' && (!Number.isInteger(spec.min) || !Number.isInteger(spec.max) || spec.min > spec.max)) {
      errors.push(`${event.name}.${key}: bounded integer range required`);
    }
  }
}

for (const required of [
  'landing_viewed','assessment_started','question_viewed','answer_interaction',
  'assessment_resumed','assessment_completed','result_viewed','share_initiated',
  'share_method_selected','share_snapshot_created','public_share_viewed',
  'client_error','server_error','performance_measure'
]) {
  if (!names.has(required)) errors.push(`missing required event ${required}`);
}

const answerEvent = dictionary.events.find((event) => event.name === 'answer_interaction');
if (answerEvent && Object.keys(answerEvent.properties ?? {}).some((key) => /answer|value|score/i.test(key))) {
  errors.push('answer_interaction must describe interaction state only, never answer value/score');
}

if (errors.length) {
  console.error(`Analytics event validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Analytics validation passed: ${dictionary.events.length} first-party events plus ${retention.retention_policy_version}; property allowlists, retention windows, cascade deletion and raw diagnostic payload bans enforced.`);
