import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const SHA256_HEX_PATTERN=/^[a-f0-9]{64}$/;

export function sha256Bytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

export function inspectFileIdentity(relativePath,{root=process.cwd()}={}) {
  if (
    typeof relativePath!=='string'
    || relativePath.length===0
    || path.isAbsolute(relativePath)
    || relativePath.includes('\\')
    || relativePath.split('/').some((part)=>part==='' || part==='.' || part==='..')
  ) {
    throw new Error('INVALID_FROZEN_PATH');
  }

  const absolute=path.join(root,...relativePath.split('/'));
  const bytes=fs.readFileSync(absolute);
  return {
    path:relativePath,
    bytes:bytes.length,
    sha256:sha256Bytes(bytes)
  };
}

export function aggregateFileIdentities(entries) {
  if (!Array.isArray(entries) || entries.length===0) {
    throw new Error('FROZEN_FILE_LIST_REQUIRED');
  }

  const seen=new Set();
  let input='';
  for (const entry of entries) {
    if (!entry || typeof entry.path!=='string' || !SHA256_HEX_PATTERN.test(entry.sha256 ?? '')) {
      throw new Error('INVALID_FROZEN_FILE_IDENTITY');
    }
    if (seen.has(entry.path)) {
      throw new Error('DUPLICATE_FROZEN_PATH');
    }
    seen.add(entry.path);
    input+=`${entry.path}\0${entry.sha256}\n`;
  }
  return sha256Bytes(Buffer.from(input,'utf8'));
}

export function verifyFrozenFileIdentities(manifest,{root=process.cwd(),expectedPaths=null}={}) {
  const errors=[];
  const entries=manifest?.files;

  if (!Array.isArray(entries) || entries.length===0) {
    return ['frozen file list missing'];
  }

  const paths=entries.map((entry)=>entry?.path);
  if (new Set(paths).size!==paths.length) {
    errors.push('frozen file paths must be unique');
  }

  if (Array.isArray(expectedPaths) && JSON.stringify(paths)!==JSON.stringify(expectedPaths)) {
    errors.push('frozen file path/order contract drift');
  }

  const actual=[];
  for (const entry of entries) {
    try {
      const inspected=inspectFileIdentity(entry.path,{root});
      actual.push(inspected);
      if (entry.bytes!==inspected.bytes) {
        errors.push(`${entry.path}: byte length drift`);
      }
      if (entry.sha256!==inspected.sha256) {
        errors.push(`${entry.path}: sha256 drift`);
      }
    } catch (error) {
      const message=error instanceof Error ? error.message : String(error);
      errors.push(`${entry?.path ?? '<missing-path>'}: unreadable/invalid frozen file (${message})`);
    }
  }

  if (actual.length===entries.length) {
    try {
      const aggregate=aggregateFileIdentities(actual);
      if (manifest.aggregate_sha256!==aggregate) {
        errors.push('frozen aggregate sha256 drift');
      }
    } catch (error) {
      errors.push(`aggregate validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return errors;
}
