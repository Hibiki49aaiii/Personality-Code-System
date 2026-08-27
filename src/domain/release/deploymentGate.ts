export type DeploymentEnvironment = 'development' | 'preview' | 'production';

export class DeploymentEnvironmentError extends Error {
  readonly code: 'DEPLOYMENT_ENV_REQUIRED' | 'DEPLOYMENT_ENV_INVALID';

  constructor(code: DeploymentEnvironmentError['code'], message: string) {
    super(message);
    this.name = 'DeploymentEnvironmentError';
    this.code = code;
  }
}

export function resolveDeploymentEnvironment(
  configured: string | undefined,
  nodeEnv: string | undefined
): DeploymentEnvironment {
  if (!configured) {
    if (nodeEnv === 'production') {
      throw new DeploymentEnvironmentError(
        'DEPLOYMENT_ENV_REQUIRED',
        'PCS_DEPLOYMENT_ENV is required when NODE_ENV=production'
      );
    }
    return 'development';
  }

  if (configured !== 'development' && configured !== 'preview' && configured !== 'production') {
    throw new DeploymentEnvironmentError(
      'DEPLOYMENT_ENV_INVALID',
      'PCS_DEPLOYMENT_ENV must be development, preview, or production'
    );
  }
  return configured;
}

export interface AssessmentStartReleaseDecisionInput {
  deploymentEnvironment: DeploymentEnvironment;
  requestedModelVersion: string;
  candidateModelVersion: string;
  candidateProductionActivationAllowed: boolean;
  candidatePublicReleaseAllowed: boolean;
  publicLaunchReady: boolean;
  publicIndexingAllowed: boolean;
}

export interface AssessmentStartReleaseDecision {
  allowed: boolean;
  reason:
    | 'non-production-environment'
    | 'production-model-mismatch'
    | 'candidate-production-activation-blocked'
    | 'candidate-public-release-blocked'
    | 'public-launch-blocked'
    | 'public-indexing-blocked'
    | 'production-release-ready';
}

export function evaluateAssessmentStartRelease(
  input: AssessmentStartReleaseDecisionInput
): AssessmentStartReleaseDecision {
  if (input.deploymentEnvironment !== 'production') {
    return { allowed: true, reason: 'non-production-environment' };
  }
  if (input.requestedModelVersion !== input.candidateModelVersion) {
    return { allowed: false, reason: 'production-model-mismatch' };
  }
  if (!input.candidateProductionActivationAllowed) {
    return { allowed: false, reason: 'candidate-production-activation-blocked' };
  }
  if (!input.candidatePublicReleaseAllowed) {
    return { allowed: false, reason: 'candidate-public-release-blocked' };
  }
  if (!input.publicLaunchReady) {
    return { allowed: false, reason: 'public-launch-blocked' };
  }
  if (!input.publicIndexingAllowed) {
    return { allowed: false, reason: 'public-indexing-blocked' };
  }
  return { allowed: true, reason: 'production-release-ready' };
}
