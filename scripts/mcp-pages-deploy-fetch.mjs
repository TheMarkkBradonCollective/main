#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const headers = readFileSync(join(ROOT, '_headers'), 'utf8');
const redirects = readFileSync(join(ROOT, '_redirects'), 'utf8');
const wranglerToml = readFileSync(join(ROOT, 'wrangler.toml'), 'utf8');
const configHash = createHash('sha256').update(wranglerToml).digest('hex');
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

const manifestUrl =
  'https://pub-07d688bf950545ddba9025a723c0798e.r2.dev/_deploy/pages-manifest-613c686.json';

const code = `async () => {
  const manifestObj = await fetch(${JSON.stringify(manifestUrl)}).then((r) => {
    if (!r.ok) throw new Error('manifest fetch ' + r.status);
    return r.json();
  });
  const form = new FormData();
  form.append('manifest', JSON.stringify(manifestObj));
  form.append('branch', 'main');
  form.append('commit_hash', '613c686a6cba9b05452fae71f688d00b3880da43');
  form.append('commit_message', 'Catalog: StrainVerse v1.3.0 on central R2');
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

writeFileSync('/tmp/mcp-pages-deploy-fetch.json', JSON.stringify({ code }), 'utf8');
console.log('deploy fetch code len', code.length);
