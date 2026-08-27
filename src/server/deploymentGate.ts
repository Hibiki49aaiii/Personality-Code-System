import releaseManifest from '../../data/release/assessment-dev-v0.3.json';
import publicLaunchGate from '../../data/release/public-launch-gate-v0.1-dev.json';
import {
  evaluateAssessmentStartRelease,
  resolveDeploymentEnvironment
} from '../domain/release/deploymentGate';

export class AssessmentReleaseBlockedError extends Error {
  readonly code = 'ASSESSMENT_RELEASE_BLOCKED';
  readonly reason: string;

  constructor(reason: string) {
    super('New assessment starts are blocked by the deployment/release gate.');
    this.name = 'AssessmentReleaseBlockedError';
    this.reason = reason;
  }
}

export function getDeploymentEnvironment() {
  try {
    return resolveDeploymentEnvironment(
      process.env.PCS_DEPLOYMENT_ENV,
      process.env.NODE_ENV
    );
  } catch (error) {
    throw new AssessmentReleaseBlockedError(
      error instanceof Error ? error.message : 'deployment-environment-invalid'
    );
  }
}

export function assertNewAssessmentStartAllowed(modelVersion: string): void {
  const deploymentEnvironment = getDeploymentEnvironment();
  const decision = evaluateAssessmentStartRelease({
    deploymentEnvironment,
    requestedModelVersion: modelVersion,
    candidateModelVersion: releaseManifest.model_version,
    candidateProductionActivationAllowed: releaseManifest.production_activation_allowed,
    candidatePublicReleaseAllowed: releaseManifest.public_release_allowed,
    publicLaunchReady: publicLaunchGate.public_launch_ready,
    publicIndexingAllowed: publicLaunchGate.launch_actions.enable_public_indexing_allowed
  });

  if (!decision.allowed) {
    throw new AssessmentReleaseBlockedError(decision.reason);
  }
}

export function isPublicIndexingAllowed(): boolean {
  return (
    publicLaunchGate.public_launch_ready === true &&
    publicLaunchGate.launch_actions.enable_public_indexing_allowed === true
  );
}
