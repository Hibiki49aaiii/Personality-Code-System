import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildObservedTypeDistribution } from '../../src/domain/analytics/observedTypeDistribution';
import {
  evaluateObservedDistributionPublication,
  observedCodeDisplay,
  formatObservedCodeScopeStatement,
  type ObservedDistributionPublicationPolicy
} from '../../src/domain/analytics/observedDistributionPublication';

const policy = JSON.parse(readFileSync('data/analytics/observed-distribution-publication-policy-v0.1-dev.json','utf8')) as ObservedDistributionPublicationPolicy;
const scope = {
  assessmentModelVersion: 'assessment-v1',
  codeSchemaVersion: 'code-v1',
  locale: 'ja-JP',
  startInclusive: '2026-08-01T00:00:00.000Z',
  endExclusive: '2026-09-01T00:00:00.000Z',
  eligibilityRule: 'all-completed-snapshots' as const
};

test('development/beta or non-public code schemas can never be published', () => {
  const distribution=buildObservedTypeDistribution(scope,[{coreCode:'AAAAAA',count:1200}]);
  assert.deepEqual(evaluateObservedDistributionPublication(distribution,{modelStatus:'beta',codeSchemaPublicUse:true},policy),{publishable:false,reason:'model-not-published'});
  assert.deepEqual(evaluateObservedDistributionPublication(distribution,{modelStatus:'published',codeSchemaPublicUse:false},policy),{publishable:false,reason:'code-schema-not-public'});
});

test('scope sample and cell-count thresholds fail closed', () => {
  const small=buildObservedTypeDistribution(scope,[{coreCode:'AAAAAA',count:999}]);
  const smallDecision=evaluateObservedDistributionPublication(small,{modelStatus:'published',codeSchemaPublicUse:true},policy);
  assert.deepEqual(smallDecision,{publishable:false,reason:'scope-sample-too-small'});
  assert.deepEqual(observedCodeDisplay(small,'AAAAAA',smallDecision,policy),{available:false,labelJa:'集計データ不足'});

  const large=buildObservedTypeDistribution(scope,[{coreCode:'AAAAAA',count:995},{coreCode:'BBBBBB',count:5}]);
  const decision=evaluateObservedDistributionPublication(large,{modelStatus:'published',codeSchemaPublicUse:true},policy);
  assert.deepEqual(decision,{publishable:true,reason:'eligible'});
  assert.deepEqual(observedCodeDisplay(large,'BBBBBB',decision,policy),{available:false,labelJa:'集計データ不足'});
});

test('eligible observed value carries sample/model/locale/time scope and never population wording', () => {
  const distribution=buildObservedTypeDistribution(scope,[{coreCode:'AAAAAA',count:975},{coreCode:'BBBBBB',count:25}]);
  const decision=evaluateObservedDistributionPublication(distribution,{modelStatus:'published',codeSchemaPublicUse:true},policy);
  const display=observedCodeDisplay(distribution,'BBBBBB',decision,policy);
  assert.equal(display.available,true);
  if (!display.available) return;
  assert.equal(display.percentageText,'2.5%');
  const statement=formatObservedCodeScopeStatement({distribution,coreCode:'BBBBBB',percentageText:display.percentageText});
  assert.match(statement,/assessment-v1/);
  assert.match(statement,/ja-JP/);
  assert.match(statement,/1,000 件/);
  assert.match(statement,/2\.5%/);
  for (const pattern of policy.prohibited_copy_patterns) assert.equal(statement.includes(pattern),false,pattern);
});
