import {
  createHash,
  randomBytes
} from 'node:crypto';
import {
  closeSync,
  fchmodSync,
  openSync,
  statSync,
  unlinkSync,
  writeFileSync
} from 'node:fs';

export const CALIBRATION_OPERATOR_TOKEN_BYTES = 32;
export const CALIBRATION_OPERATOR_TOKEN_LENGTH = 43;
export const CALIBRATION_OPERATOR_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
export const CALIBRATION_OPERATOR_HASH_PATTERN = /^[a-f0-9]{64}$/;
export const CALIBRATION_OPERATOR_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const CALIBRATION_OPERATOR_ROLES = Object.freeze([
  'calibration-export-requester',
  'calibration-export-approver',
  'calibration-privacy-operator',
  'calibration-reviewer'
]);

const COMMANDS = new Set([
  'issue',
  'whoami',
  'grant-role',
  'revoke-role',
  'revoke-credential'
]);

export class CalibrationOperatorCliError extends Error {
  constructor(code) {
    super(code);
    this.name = 'CalibrationOperatorCliError';
    this.code = code;
  }
}

export function generateCalibrationOperatorCredential() {
  const token = randomBytes(CALIBRATION_OPERATOR_TOKEN_BYTES).toString('base64url');
  if (
    token.length !== CALIBRATION_OPERATOR_TOKEN_LENGTH ||
    !CALIBRATION_OPERATOR_TOKEN_PATTERN.test(token)
  ) {
    throw new CalibrationOperatorCliError('CREDENTIAL_GENERATION_FAILED');
  }
  return {
    token,
    tokenHashHex: hashCalibrationOperatorCredential(token)
  };
}

export function hashCalibrationOperatorCredential(token) {
  if (
    typeof token !== 'string' ||
    !CALIBRATION_OPERATOR_TOKEN_PATTERN.test(token)
  ) {
    throw new CalibrationOperatorCliError('AUTHENTICATION_FAILED');
  }
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function validateCalibrationOperatorId(operatorId) {
  if (
    typeof operatorId !== 'string' ||
    !CALIBRATION_OPERATOR_ID_PATTERN.test(operatorId)
  ) {
    throw new CalibrationOperatorCliError('INVALID_OPERATOR_ID');
  }
  return operatorId.toLowerCase();
}

export function validateCalibrationOperatorRole(role, roleAllowlist = CALIBRATION_OPERATOR_ROLES) {
  if (typeof role !== 'string' || !roleAllowlist.includes(role)) {
    throw new CalibrationOperatorCliError('INVALID_ROLE');
  }
  return role;
}

export function normalizeRoles(roles, roleAllowlist = CALIBRATION_OPERATOR_ROLES) {
  if (!Array.isArray(roles) || roles.length === 0) {
    throw new CalibrationOperatorCliError('ROLE_REQUIRED');
  }
  const normalized = [...new Set(
    roles.map((role) => validateCalibrationOperatorRole(role, roleAllowlist))
  )].sort();
  return normalized;
}

function takeValue(argv, index, flag) {
  const value = argv[index + 1];
  if (typeof value !== 'string' || value.length === 0 || value.startsWith('--')) {
    throw new CalibrationOperatorCliError(`MISSING_VALUE_${flag.slice(2).toUpperCase().replaceAll('-', '_')}`);
  }
  return value;
}

export function parseCalibrationOperatorArgs(argv, roleAllowlist = CALIBRATION_OPERATOR_ROLES) {
  if (!Array.isArray(argv) || argv.length === 0) {
    throw new CalibrationOperatorCliError('COMMAND_REQUIRED');
  }

  const [command, ...rest] = argv;
  if (!COMMANDS.has(command)) {
    throw new CalibrationOperatorCliError('INVALID_COMMAND');
  }

  if (command === 'whoami') {
    if (rest.length !== 0) {
      throw new CalibrationOperatorCliError('WHOAMI_TAKES_NO_ARGUMENTS');
    }
    return { command };
  }

  const roles = [];
  let operatorId = null;
  let credentialOut = null;

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === '--token' || arg === '--credential' || arg === '--credential-token') {
      throw new CalibrationOperatorCliError('TOKEN_ARGV_FORBIDDEN');
    }

    if (arg === '--role') {
      const value = takeValue(rest, index, arg);
      roles.push(validateCalibrationOperatorRole(value, roleAllowlist));
      index += 1;
      continue;
    }

    if (arg === '--operator-id') {
      if (operatorId !== null) {
        throw new CalibrationOperatorCliError('DUPLICATE_OPERATOR_ID');
      }
      operatorId = validateCalibrationOperatorId(takeValue(rest, index, arg));
      index += 1;
      continue;
    }

    if (arg === '--credential-out') {
      if (credentialOut !== null) {
        throw new CalibrationOperatorCliError('DUPLICATE_CREDENTIAL_OUT');
      }
      const value = takeValue(rest, index, arg);
      if (value.includes('\0')) {
        throw new CalibrationOperatorCliError('INVALID_CREDENTIAL_OUT');
      }
      credentialOut = value;
      index += 1;
      continue;
    }

    throw new CalibrationOperatorCliError('UNKNOWN_ARGUMENT');
  }

  if (command === 'issue') {
    if (operatorId !== null) {
      throw new CalibrationOperatorCliError('ISSUE_OPERATOR_ID_FORBIDDEN');
    }
    if (!credentialOut) {
      throw new CalibrationOperatorCliError('CREDENTIAL_OUT_REQUIRED');
    }
    return {
      command,
      credentialOut,
      roles: normalizeRoles(roles, roleAllowlist)
    };
  }

  if (!operatorId) {
    throw new CalibrationOperatorCliError('OPERATOR_ID_REQUIRED');
  }
  if (credentialOut !== null) {
    throw new CalibrationOperatorCliError('CREDENTIAL_OUT_NOT_ALLOWED');
  }

  if (command === 'grant-role' || command === 'revoke-role') {
    if (roles.length !== 1) {
      throw new CalibrationOperatorCliError('EXACTLY_ONE_ROLE_REQUIRED');
    }
    return {
      command,
      operatorId,
      role: validateCalibrationOperatorRole(roles[0], roleAllowlist)
    };
  }

  if (roles.length !== 0) {
    throw new CalibrationOperatorCliError('ROLE_NOT_ALLOWED');
  }

  return {
    command,
    operatorId
  };
}

export function writeCredentialFileExclusive(path, token) {
  if (typeof path !== 'string' || path.length === 0 || path.includes('\0')) {
    throw new CalibrationOperatorCliError('INVALID_CREDENTIAL_OUT');
  }
  if (
    typeof token !== 'string' ||
    !CALIBRATION_OPERATOR_TOKEN_PATTERN.test(token)
  ) {
    throw new CalibrationOperatorCliError('CREDENTIAL_WRITE_FAILED');
  }

  let fd;
  try {
    fd = openSync(path, 'wx', 0o600);
    writeFileSync(fd, `${token}\n`, { encoding: 'utf8' });
    fchmodSync(fd, 0o600);
    closeSync(fd);
    fd = undefined;

    const mode = statSync(path).mode & 0o777;
    if (mode !== 0o600) {
      try {
        unlinkSync(path);
      } catch {
        // Best-effort cleanup; never expose path/token through error detail.
      }
      throw new CalibrationOperatorCliError('CREDENTIAL_FILE_MODE_INVALID');
    }
  } catch (error) {
    if (fd !== undefined) {
      try {
        closeSync(fd);
      } catch {
        // Ignore close cleanup errors.
      }
    }
    if (error instanceof CalibrationOperatorCliError) {
      throw error;
    }
    throw new CalibrationOperatorCliError('CREDENTIAL_WRITE_FAILED');
  }
}

export function removeCredentialFileBestEffort(path) {
  try {
    unlinkSync(path);
  } catch {
    // Best effort only; caller returns a bounded error without leaking path.
  }
}

export function safeCliErrorCode(error) {
  if (error instanceof CalibrationOperatorCliError) {
    return error.code;
  }
  return 'OPERATION_FAILED';
}
