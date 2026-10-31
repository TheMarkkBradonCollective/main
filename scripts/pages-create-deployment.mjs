#!/usr/bin/env node
/**
 * POST Pages deployment with manifest (run after pages-direct-upload.mjs).
 * Requires CLOUDFLARE_API_TOKEN or wrangler OAuth; otherwise prints manifest path for MCP deploy.
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const ROOT = process.cwd();
const manifest = JSON.parse(
  readFileSync(join(ROOT, '.pages-manifest.json'), 'utf8')
);
const headers = readFileSync(join(ROOT, '_headers'), 'utf8');
const redirects = readFileSync(join(ROOT, '_redirects'), 'utf8');
const wranglerToml = readFileSync(join(ROOT, 'wrangler.toml'), 'utf8');
const configHash = createHash('sha256').update(wranglerToml).digest('hex');

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '92d9592953c4d46474ae07993913f710';
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!token) {
  console.error('CLOUDFLARE_API_TOKEN not set — use Cloudflare MCP to POST deployment with .pages-manifest.json');
  process.exit(2);
}

const form = new FormData();
form.append('manifest', JSON.stringify(manifest));
form.append('branch', 'main');
form.append('commit_hash', process.env.DEPLOY_COMMIT || '613c686a6cba9b05452fae71f688d00b3880da43');
form.append('commit_message', process.env.DEPLOY_MESSAGE || 'Catalog: StrainVerse v1.3.0 on central R2');
form.append('commit_dirty', 'false');
form.append('pages_build_output_dir', '.');
form.append('wrangler_config_hash', configHash);
form.append('_headers', new Blob([headers], { type: 'text/plain' }), '_headers');
form.append('_redirects', new Blob([redirects], { type: 'text/plain' }), '_redirects');

const res = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/mbc-store/deployments`,
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  }
);
const json = await res.json();
if (!json.success) {
  console.error(JSON.stringify(json.errors, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(json.result, null, 2));
