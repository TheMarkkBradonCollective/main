#!/usr/bin/env node
/**
 * Stage dist/ and publish it to the mbc-store Cloudflare Pages project.
 * Wrangler prefixes every asset path with "/", which Pages requires.
 */
import { execSync } from 'node:child_process';

execSync('node scripts/stage-pages-output.mjs', { stdio: 'inherit' });
execSync('npx wrangler pages deploy dist --project-name=mbc-store', {
  stdio: 'inherit',
});
