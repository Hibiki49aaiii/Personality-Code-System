function assertBuffer(buffer) {
  if (!Buffer.isBuffer(buffer)) throw new TypeError('image metadata parser requires a Buffer');
}

function parsePng(buffer) {
  const signature=Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  if (buffer.length<24 || !buffer.subarray(0,8).equals(signature)) throw new Error('invalid PNG signature/header');
  if (buffer.subarray(12,16).toString('ascii')!=='IHDR') throw new Error('PNG IHDR must be first chunk');
  return {
    mediaType:'image/png',
    width:buffer.readUInt32BE(16),
    height:buffer.readUInt32BE(20)
  };
}

function parseWebp(buffer) {
  if (buffer.length<30 || buffer.subarray(0,4).toString('ascii')!=='RIFF' || buffer.subarray(8,12).toString('ascii')!=='WEBP') {
    throw new Error('invalid WebP RIFF header');
  }
  const chunk=buffer.subarray(12,16).toString('ascii');
  const data=20;
  if (chunk==='VP8X') {
    if (buffer.length<data+10) throw new Error('truncated VP8X');
    return {
      mediaType:'image/webp',
      width:1+buffer.readUIntLE(data+4,3),
      height:1+buffer.readUIntLE(data+7,3)
    };
  }
  if (chunk==='VP8 ') {
    if (buffer.length<data+10) throw new Error('truncated VP8');
    if (buffer[data+3]!==0x9d || buffer[data+4]!==0x01 || buffer[data+5]!==0x2a) throw new Error('invalid VP8 frame header');
    return {
      mediaType:'image/webp',
      width:buffer.readUInt16LE(data+6)&0x3fff,
      height:buffer.readUInt16LE(data+8)&0x3fff
    };
  }
  if (chunk==='VP8L') {
    if (buffer.length<data+5 || buffer[data]!==0x2f) throw new Error('invalid VP8L frame header');
    const b1=buffer[data+1], b2=buffer[data+2], b3=buffer[data+3], b4=buffer[data+4];
    return {
      mediaType:'image/webp',
      width:1+(((b2&0x3f)<<8)|b1),
      height:1+(((b4&0x0f)<<10)|(b3<<2)|((b2&0xc0)>>6))
    };
  }
  throw new Error(`unsupported WebP primary chunk ${chunk}`);
}

function parseSvg(buffer) {
  const source=buffer.toString('utf8').replace(/^\uFEFF/,'').trimStart();
  const match=source.match(/<svg\b([^>]*)>/i);
  if (!match) throw new Error('invalid SVG root');
  const attrs=match[1];
  const numeric=(name)=>{
    const m=attrs.match(new RegExp('\\b'+name+'\\s*=\\s*["\\\']\\s*([0-9]+(?:\\.[0-9]+)?)(?:px)?\\s*["\\\']','i'));
    return m?Number(m[1]):null;
  };
  let width=numeric('width');
  let height=numeric('height');
  if (width===null || height===null) {
    const vb=attrs.match(/\bviewBox\s*=\s*["']\s*([-+0-9.eE]+)[ ,]+([-+0-9.eE]+)[ ,]+([-+0-9.eE]+)[ ,]+([-+0-9.eE]+)\s*["']/i);
    if (vb) {
      const w=Number(vb[3]), h=Number(vb[4]);
      if (Number.isFinite(w)&&w>0&&Number.isFinite(h)&&h>0) {
        width ??= w;
        height ??= h;
      }
    }
  }
  if (!(Number.isFinite(width)&&width>0&&Number.isFinite(height)&&height>0)) throw new Error('SVG needs positive width/height or viewBox');
  return {mediaType:'image/svg+xml',width,height};
}

export function inspectImageBytes(buffer, expectedMediaType) {
  assertBuffer(buffer);
  if (expectedMediaType==='image/png') return parsePng(buffer);
  if (expectedMediaType==='image/webp') return parseWebp(buffer);
  if (expectedMediaType==='image/svg+xml') return parseSvg(buffer);
  throw new Error(`unsupported image media type ${expectedMediaType}`);
}
