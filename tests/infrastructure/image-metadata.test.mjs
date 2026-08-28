import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectImageBytes } from '../../scripts/lib/image-metadata.mjs';

test('reads PNG dimensions from IHDR bytes',()=>{
  const b=Buffer.alloc(24);
  Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]).copy(b,0);
  b.writeUInt32BE(13,8);
  b.write('IHDR',12,'ascii');
  b.writeUInt32BE(1200,16);
  b.writeUInt32BE(630,20);
  assert.deepEqual(inspectImageBytes(b,'image/png'),{mediaType:'image/png',width:1200,height:630});
});

test('reads VP8X WebP dimensions',()=>{
  const b=Buffer.alloc(30);
  b.write('RIFF',0,'ascii');
  b.writeUInt32LE(22,4);
  b.write('WEBP',8,'ascii');
  b.write('VP8X',12,'ascii');
  b.writeUInt32LE(10,16);
  b.writeUIntLE(1079,24,3);
  b.writeUIntLE(1349,27,3);
  assert.deepEqual(inspectImageBytes(b,'image/webp'),{mediaType:'image/webp',width:1080,height:1350});
});

test('reads SVG viewBox dimensions when explicit width/height are absent',()=>{
  const b=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 1200"></svg>');
  assert.deepEqual(inspectImageBytes(b,'image/svg+xml'),{mediaType:'image/svg+xml',width:960,height:1200});
});

test('rejects mismatched/invalid formats',()=>{
  assert.throws(()=>inspectImageBytes(Buffer.from('not-an-image'),'image/png'),/invalid PNG/);
  assert.throws(()=>inspectImageBytes(Buffer.from('<svg></svg>'),'image/svg+xml'),/positive width\/height or viewBox/);
});
