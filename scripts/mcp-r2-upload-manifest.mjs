#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const ROOT = process.cwd();
const manifest = readFileSync(join(ROOT, '.pages-manifest.json'), 'utf8');
const b64 = gzipSync(manifest, { level: 9 }).toString('base64');
const key = '_deploy/pages-manifest-613c686.json';

const code = `async () => {
  const b64 = \`${b64}\`;
  const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const decompressed = await new Response(
    new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))
  ).arrayBuffer();
  const body = new TextDecoder().decode(decompressed);
  return cloudflare.request({
    method: 'PUT',
    path: \`/accounts/\${accountId}/r2/buckets/mbc-store-apks/objects/${encodeURIComponent(key)}\`,
    body,
    contentType: 'application/json',
  });
}`;

writeFileSync('/tmp/mcp-r2-upload-code.json', JSON.stringify({ code }), 'utf8');
console.log('upload code len', code.length);
