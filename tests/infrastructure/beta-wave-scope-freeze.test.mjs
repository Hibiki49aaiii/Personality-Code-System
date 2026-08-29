import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  aggregateFileIdentities,
  inspectFileIdentity,
  sha256Bytes,
  verifyFrozenFileIdentities
} from '../../scripts/lib/file-identity.mjs';

test('sha256Bytes matches known vector',()=>{
  assert.equal(
    sha256Bytes(Buffer.from('abc','utf8')),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
  );
});

test('file identity and aggregate are deterministic and order-sensitive',()=>{
  const dir=mkdtempSync(join(tmpdir(),'pcs-freeze-'));
  try {
    writeFileSync(join(dir,'a.txt'),'alpha\n','utf8');
    writeFileSync(join(dir,'b.txt'),'beta\n','utf8');
    const a=inspectFileIdentity('a.txt',{root:dir});
    const b=inspectFileIdentity('b.txt',{root:dir});
    assert.equal(a.bytes,6);
    assert.equal(a.sha256,sha256Bytes(Buffer.from('alpha\n')));
    assert.equal(aggregateFileIdentities([a,b]),aggregateFileIdentities([a,b]));
    assert.notEqual(aggregateFileIdentities([a,b]),aggregateFileIdentities([b,a]));
  } finally {
    rmSync(dir,{recursive:true,force:true});
  }
});

test('frozen identity verification detects mutation missing files duplicates and order drift',()=>{
  const dir=mkdtempSync(join(tmpdir(),'pcs-freeze-'));
  try {
    mkdirSync(join(dir,'nested'));
    writeFileSync(join(dir,'nested','a.txt'),'alpha','utf8');
    writeFileSync(join(dir,'nested','b.txt'),'beta','utf8');
    const entries=[
      inspectFileIdentity('nested/a.txt',{root:dir}),
      inspectFileIdentity('nested/b.txt',{root:dir})
    ];
    const manifest={
      files:entries,
      aggregate_sha256:aggregateFileIdentities(entries)
    };

    assert.deepEqual(
      verifyFrozenFileIdentities(manifest,{root:dir,expectedPaths:['nested/a.txt','nested/b.txt']}),
      []
    );

    writeFileSync(join(dir,'nested','a.txt'),'changed','utf8');
    assert.ok(
      verifyFrozenFileIdentities(manifest,{root:dir,expectedPaths:['nested/a.txt','nested/b.txt']})
        .some((error)=>error.includes('sha256 drift'))
    );

    rmSync(join(dir,'nested','b.txt'));
    assert.ok(
      verifyFrozenFileIdentities(manifest,{root:dir,expectedPaths:['nested/a.txt','nested/b.txt']})
        .some((error)=>error.includes('unreadable/invalid frozen file'))
    );

    const duplicate={
      files:[entries[0],entries[0]],
      aggregate_sha256:aggregateFileIdentities(entries)
    };
    assert.ok(verifyFrozenFileIdentities(duplicate,{root:dir}).some((error)=>error.includes('unique')));

    assert.ok(
      verifyFrozenFileIdentities(
        {files:[entries[1],entries[0]],aggregate_sha256:aggregateFileIdentities([entries[1],entries[0]])},
        {root:dir,expectedPaths:['nested/a.txt','nested/b.txt']}
      ).some((error)=>error.includes('path/order contract drift'))
    );
  } finally {
    rmSync(dir,{recursive:true,force:true});
  }
});

test('invalid frozen paths fail closed',()=>{
  const dir=mkdtempSync(join(tmpdir(),'pcs-freeze-'));
  try {
    assert.throws(()=>inspectFileIdentity('../secret',{root:dir}),/INVALID_FROZEN_PATH/);
    assert.throws(()=>inspectFileIdentity('/absolute',{root:dir}),/INVALID_FROZEN_PATH/);
    assert.throws(
      ()=>aggregateFileIdentities([
        {path:'a',sha256:'0'.repeat(64)},
        {path:'a',sha256:'1'.repeat(64)}
      ]),
      /DUPLICATE_FROZEN_PATH/
    );
  } finally {
    rmSync(dir,{recursive:true,force:true});
  }
});
