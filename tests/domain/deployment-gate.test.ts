import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DeploymentEnvironmentError,
  evaluateAssessmentStartRelease,
  resolveDeploymentEnvironment
} from '../../src/domain/release/deploymentGate';

test('development resolves implicitly only outside production Node runtime', () => {
  assert.equal(resolveDeploymentEnvironment(undefined, 'development'), 'development');
  assert.equal(resolveDeploymentEnvironment(undefined, 'test'), 'development');
  assert.throws(
    () => resolveDeploymentEnvironment(undefined, 'production'),
    (error: unknown) =>
      error instanceof DeploymentEnvironmentError &&
      error.code === 'DEPLOYMENT_ENV_REQUIRED'
  );
});

test('configured deployment environment is explicit and validated', () => {
  assert.equal(resolveDeploymentEnvironment('preview', 'production'), 'preview');
  assert.equal(resolveDeploymentEnvironment('production', 'production'), 'production');
  assert.throws(
    () => resolveDeploymentEnvironment('staging', 'production'),
    (error: unknown) =>
      error instanceof DeploymentEnvironmentError &&
      error.code === 'DEPLOYMENT_ENV_INVALID'
  );
});

test('preview may exercise blocked beta candidate while production remains fail-closed', () => {
  const preview = evaluateAssessmentStartRelease({
    deploymentEnvironment: 'preview',
    requestedModelVersion: 'assessment-dev-v0.3',
    candidateModelVersion: 'assessment-dev-v0.3',
    candidateProductionActivationAllowed: false,
    candidatePublicReleaseAllowed: false,
    publicLaunchReady: false,
    publicIndexingAllowed: false
  });
  assert.deepEqual(preview, { allowed: true, reason: 'non-production-environment' });

  const production = evaluateAssessmentStartRelease({
    deploymentEnvironment: 'production',
    requestedModelVersion: 'assessment-dev-v0.3',
    candidateModelVersion: 'assessment-dev-v0.3',
    candidateProductionActivationAllowed: false,
    candidatePublicReleaseAllowed: false,
    publicLaunchReady: false,
    publicIndexingAllowed: false
  });
  assert.deepEqual(production, {
    allowed: false,
    reason: 'candidate-production-activation-blocked'
  });
});

test('production starts only when exact candidate and all public activation flags are ready', () => {
  const allowed = evaluateAssessmentStartRelease({
    deploymentEnvironment: 'production',
    requestedModelVersion: 'assessment-v1.0',
    candidateModelVersion: 'assessment-v1.0',
    candidateProductionActivationAllowed: true,
    candidatePublicReleaseAllowed: true,
    publicLaunchReady: true,
    publicIndexingAllowed: true
  });
  assert.deepEqual(allowed, { allowed: true, reason: 'production-release-ready' });

  const mismatch = evaluateAssessmentStartRelease({
    deploymentEnvironment: 'production',
    requestedModelVersion: 'assessment-other',
    candidateModelVersion: 'assessment-v1.0',
    candidateProductionActivationAllowed: true,
    candidatePublicReleaseAllowed: true,
    publicLaunchReady: true,
    publicIndexingAllowed: true
  });
  assert.deepEqual(mismatch, { allowed: false, reason: 'production-model-mismatch' });
});
