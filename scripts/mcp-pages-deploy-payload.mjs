#!/usr/bin/env node
/**
 * Emit Cloudflare MCP execute() code for Pages deployment (gzip manifest embedded).
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const ROOT = process.cwd();
const manifest = readFileSync(join(ROOT, '.pages-manifest.json'), 'utf8');
const b64 = gzipSync(manifest, { level: 9 }).toString('base64');
const headers = readFileSync(join(ROOT, '_headers'), 'utf8');
const redirects = readFileSync(join(ROOT, '_redirects'), 'utf8');
const wranglerToml = readFileSync(join(ROOT, 'wrangler.toml'), 'utf8');
const configHash = createHash('sha256').update(wranglerToml).digest('hex');

const commitHash =
  process.env.DEPLOY_COMMIT || '613c686a6cba9b05452fae71f688d00b3880da43';
const commitMessage =
  process.env.DEPLOY_MESSAGE || 'Catalog: StrainVerse v1.3.0 on central R2';

// Escape for template literal in generated code
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

const code = `async () => {
  const b64 = \`${b64}\`;
  const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const decompressed = await new Response(
    new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))
  ).arrayBuffer();
  const manifestObj = JSON.parse(new TextDecoder().decode(decompressed));
  const form = new FormData();
  form.append('manifest', JSON.stringify(manifestObj));
  form.append('branch', 'main');
  form.append('commit_hash', '${commitHash}');
  form.append('commit_message', ${JSON.stringify(commitMessage)});
  form.append('commit_dirty', 'false');
  form.append('pages_build_output_dir', '.');
  form.append('wrangler_config_hash', '${configHash}');
  form.append('_headers', new Blob([\`${esc(headers)}\`], { type: 'text/plain' }), '_headers');
  form.append('_redirects', new Blob([\`${esc(redirects)}\`], { type: 'text/plain' }), '_redirects');
  return cloudflare.request({
    method: 'POST',
    path: \`/accounts/\${accountId}/pages/projects/mbc-store/deployments\`,
    body: form,
  });
}`;

writeFileSync('/tmp/mcp-pages-deploy-code.json', JSON.stringify({ code }), 'utf8');
console.log('Wrote /tmp/mcp-pages-deploy-code.json', 'b64_len', b64.length, 'code_len', code.length);
