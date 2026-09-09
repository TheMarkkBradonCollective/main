#!/usr/bin/env node
/**
 * Build a signed release AAB for one MBC app.
 *
 * Usage:
 *   node scripts/play/build-aab.mjs navigate
 *   node scripts/play/build-aab.mjs --all
 */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ensureAndroidSdk, findAabOutput, run } from './lib/android-sdk.mjs';
import { patchGradleSigning, writeKeystoreProperties } from './lib/keystore.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const configPath = path.join(__dirname, 'play-apps.json');
const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

function getGithubToken() {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || (() => {
    try {
      return execSync('gh auth token', { encoding: 'utf8' }).trim();
    } catch {
      return null;
    }
  })();
}

function parseVersionFromName(name) {
  const match = name.match(/v?(\d+\.\d+(?:\.\d+)?(?:\.\d+)?)/i);
  return match ? match[1] : '1.0.0';
}

function sha256File(filePath) {
  const hash = createHash('sha256');
  hash.update(readFileSync(filePath));
  return hash.digest('hex');
}

async function cloneRepo(app) {
  const token = getGithubToken();
  if (!token) {
    throw new Error(`${app.slug}: GITHUB_TOKEN required to clone private repo`);
  }
  const match = app.github.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error(`Invalid github URL for ${app.slug}`);
  const [, owner, repo] = match;
  const cleanRepo = repo.replace(/\.git$/, '');
  const dest = path.join(os.tmpdir(), 'mbc-play-builds', app.slug);
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(path.dirname(dest), { recursive: true });
  const cloneUrl = `https://x-access-token:${token}@github.com/${owner}/${cleanRepo}.git`;
  console.log(`Cloning ${owner}/${cleanRepo}…`);
  run('git', ['clone', '--depth', '1', cloneUrl, dest]);
  return dest;
}

async function resolveProjectRoot(app) {
  if (app.build.projectDir && !app.build.clone) {
    return path.join(repoRoot, app.build.projectDir);
  }
  if (app.build.clone) {
    return await cloneRepo(app);
  }
  throw new Error(`${app.slug}: no projectDir or clone config`);
}

async function buildCapacitorProject(app, projectRoot) {
  const pkgPath = path.join(projectRoot, 'package.json');
  if (!existsSync(pkgPath)) {
    throw new Error(`${app.slug}: no package.json in ${projectRoot}`);
  }

  if (existsSync(path.join(projectRoot, 'package-lock.json'))) {
    run('npm', ['ci'], { cwd: projectRoot });
  } else {
    run('npm', ['install'], { cwd: projectRoot });
  }

  if (existsSync(path.join(projectRoot, 'node_modules/.bin/vite'))) {
    run('npm', ['run', 'build'], { cwd: projectRoot });
  }

  const androidDir = app.build.androidDir
    ? path.join(repoRoot, app.build.androidDir)
    : path.join(projectRoot, 'android');

  if (!existsSync(androidDir)) {
    run('npx', ['cap', 'add', 'android'], { cwd: projectRoot });
  }
  run('npx', ['cap', 'sync', 'android'], { cwd: projectRoot });

  return androidDir;
}

async function buildGradleProject(app) {
  return path.join(repoRoot, app.build.projectDir);
}

async function buildApp(app) {
  console.log(`\n=== ${app.name} (${app.packageId}) ===\n`);
  await ensureAndroidSdk();

  const projectRoot = await resolveProjectRoot(app);
  const androidDir =
    app.build.type === 'capacitor'
      ? await buildCapacitorProject(app, projectRoot)
      : await buildGradleProject(app);

  const signingRoot = app.build.clone ? projectRoot : repoRoot;
  await writeKeystoreProperties(androidDir, app.signing, signingRoot);
  await patchGradleSigning(androidDir);

  const gradlew = path.join(androidDir, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
  if (!existsSync(gradlew)) {
    throw new Error(`${app.slug}: gradlew not found in ${androidDir}`);
  }

  run(gradlew, ['bundleRelease'], { cwd: androidDir });

  const builtAab = findAabOutput(androidDir);
  if (!builtAab) {
    throw new Error(`${app.slug}: AAB not found after bundleRelease`);
  }

  const version = parseVersionFromName(path.basename(builtAab));
  const outDir = path.join(repoRoot, config.outputDir, app.slug);
  mkdirSync(outDir, { recursive: true });
  const outName = `${app.slug}-v${version}.aab`;
  const outPath = path.join(outDir, outName);
  cpSync(builtAab, outPath);

  const stat = await fs.stat(outPath);
  const meta = {
    slug: app.slug,
    name: app.name,
    packageId: app.packageId,
    version,
    versionCode: null,
    fileSize: stat.size,
    sha256: sha256File(outPath),
    builtAt: new Date().toISOString(),
    path: path.relative(repoRoot, outPath),
  };

  await fs.writeFile(path.join(outDir, 'latest.json'), JSON.stringify(meta, null, 2) + '\n');
  console.log(`\nAAB: ${outPath} (${stat.size} bytes)`);
  console.log(`SHA-256: ${meta.sha256}\n`);
  return meta;
}

const args = process.argv.slice(2);
const buildAll = args.includes('--all');
const slugs = buildAll ? config.apps.map((a) => a.slug) : args.filter((a) => !a.startsWith('--'));

if (!slugs.length) {
  console.error('Usage: node scripts/play/build-aab.mjs <slug> [slug2...] | --all');
  console.error('Apps:', config.apps.map((a) => a.slug).join(', '));
  process.exit(1);
}

const results = [];
const failures = [];

for (const slug of slugs) {
  const app = config.apps.find((a) => a.slug === slug);
  if (!app) {
    console.error(`Unknown app slug: ${slug}`);
    failures.push(slug);
    continue;
  }
  try {
    results.push(await buildApp(app));
  } catch (err) {
    console.error(`\n✗ ${slug}: ${err.message}\n`);
    failures.push(slug);
  }
}

const catalogPath = path.join(repoRoot, config.outputDir, 'catalog.json');
mkdirSync(path.dirname(catalogPath), { recursive: true });
let catalog = { generatedAt: new Date().toISOString(), apps: [] };
try {
  catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
} catch {
  /* fresh catalog */
}
const bySlug = new Map(catalog.apps.map((a) => [a.slug, a]));
for (const meta of results) bySlug.set(meta.slug, meta);
catalog.apps = [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
catalog.generatedAt = new Date().toISOString();
await fs.writeFile(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

if (failures.length) {
  console.error(`\nFailed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`\n✓ Built ${results.length} AAB(s). Catalog: ${path.relative(repoRoot, catalogPath)}\n`);
