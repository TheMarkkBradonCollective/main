#!/usr/bin/env node
/**
 * Build signed release AABs for every MBC app that already has an APK.
 *
 * Usage:
 *   node scripts/play/build-aab.mjs navigate
 *   node scripts/play/build-aab.mjs --all
 *   node scripts/play/build-aab.mjs --sync --all   # refresh play-apps.json first
 *
 * Requires GITHUB_TOKEN (repo scope) to clone private app repos.
 */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ensureAndroidSdk, findAabOutput, run } from './lib/android-sdk.mjs';
import { patchGradleSigning, writeKeystoreProperties } from './lib/keystore.mjs';
import { detectProjectType, readProjectVersion } from './lib/repo-detect.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const configPath = path.join(__dirname, 'play-apps.json');

if (process.argv.includes('--sync')) {
  const sync = spawnSync(process.execPath, [path.join(__dirname, 'sync-play-apps.mjs')], {
    stdio: 'inherit',
  });
  if (sync.status !== 0) process.exit(sync.status ?? 1);
}

const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

function getGithubToken() {
  return (
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    (() => {
      try {
        return execSync('gh auth token', { encoding: 'utf8' }).trim();
      } catch {
        return null;
      }
    })()
  );
}

function parseVersionFromName(name) {
  const match = name.match(/v?(\d+\.\d+(?:\.\d+)?(?:\.\d+)?)/i);
  return match ? match[1] : null;
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
  if (!app.github) {
    throw new Error(`${app.slug}: no github URL in play-apps.json`);
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
  if (app.build?.projectDir && !app.build?.clone) {
    const local = path.join(repoRoot, app.build.projectDir);
    if (app.build.type === 'capacitor' && app.build.androidDir) {
      return path.join(repoRoot, path.dirname(app.build.androidDir));
    }
    return local;
  }
  if (app.build?.clone) {
    return await cloneRepo(app);
  }
  throw new Error(`${app.slug}: no projectDir or clone config`);
}

function ensureCapacitorConfig(projectRoot, app) {
  const configPath = path.join(projectRoot, 'capacitor.config.json');
  if (existsSync(configPath)) return;

  const webDir = existsSync(path.join(projectRoot, 'dist'))
    ? 'dist'
    : existsSync(path.join(projectRoot, 'public'))
      ? 'public'
      : 'www';

  writeFileSync(
    configPath,
    JSON.stringify(
      {
        appId: app.packageId,
        appName: app.name,
        webDir,
        server: { androidScheme: 'https' },
      },
      null,
      2
    ) + '\n'
  );
  console.log(`  Wrote capacitor.config.json (webDir: ${webDir})`);
}

async function buildViaRepoScript(app) {
  const scriptMap = {
    navigate: path.join(repoRoot, 'Navigate/scripts/build-aab.mjs'),
  };
  const script = scriptMap[app.slug];
  if (!script || !existsSync(script)) return null;

  await ensureAndroidSdk();
  run(process.execPath, [script], { cwd: path.dirname(path.dirname(script)) });
  const latestPath = path.join(repoRoot, config.outputDir, app.slug, 'latest.json');
  if (!existsSync(latestPath)) throw new Error(`${app.slug}: repo build script did not write latest.json`);
  return JSON.parse(readFileSync(latestPath, 'utf8'));
}

async function installAndBuildWeb(projectRoot) {
  const pkgPath = path.join(projectRoot, 'package.json');
  if (!existsSync(pkgPath)) return;

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  if (existsSync(path.join(projectRoot, 'package-lock.json'))) {
    run('npm', ['ci'], { cwd: projectRoot });
  } else {
    run('npm', ['install'], { cwd: projectRoot });
  }

  if (pkg.scripts?.build) {
    run('npm', ['run', 'build'], { cwd: projectRoot });
  }
}

async function prepareAndroid(app, projectRoot) {
  const projectType = app.build?.type || detectProjectType(projectRoot);
  let androidDir;

  if (app.build?.androidDir && !app.build?.clone) {
    androidDir = path.join(repoRoot, app.build.androidDir);
  } else {
    androidDir = path.join(projectRoot, 'android');
  }

  if (projectType === 'capacitor' || existsSync(path.join(projectRoot, 'node_modules/@capacitor/cli'))) {
    ensureCapacitorConfig(projectRoot, app);
    await installAndBuildWeb(projectRoot);
    if (!existsSync(androidDir)) {
      run('npx', ['cap', 'add', 'android'], { cwd: projectRoot });
    }
    run('npx', ['cap', 'sync', 'android'], { cwd: projectRoot });
  } else if (projectType === 'twa') {
    if (!existsSync(androidDir)) {
      throw new Error(`${app.slug}: TWA android/ folder missing — run bubblewrap build in repo first`);
    }
  } else if (projectType === 'gradle') {
    androidDir = app.build.projectDir
      ? path.join(repoRoot, app.build.projectDir)
      : androidDir;
  } else if (!existsSync(androidDir)) {
    throw new Error(`${app.slug}: no android/ project found`);
  }

  return androidDir;
}

async function buildApp(app) {
  console.log(`\n=== ${app.name} (${app.packageId}) ===`);
  if (app.apkArchives) {
    console.log(`  (${app.apkArchives} historical APK archive(s) — building latest only)`);
  }

  const viaScript = await buildViaRepoScript(app);
  if (viaScript) {
    console.log(`\nAAB: ${path.join(repoRoot, viaScript.path || `aabs/${app.slug}`)}`);
    return viaScript;
  }

  await ensureAndroidSdk();

  const projectRoot = await resolveProjectRoot(app);
  const androidDir = await prepareAndroid(app, projectRoot);

  const signingRoot = app.build?.clone ? projectRoot : repoRoot;
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

  const fromCatalog = app.version;
  const fromProject = readProjectVersion(projectRoot).version;
  const fromFile = parseVersionFromName(path.basename(builtAab));
  const version = fromCatalog || fromProject || fromFile || '1.0.0';

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
    versionCode: app.versionCode ?? readProjectVersion(projectRoot).versionCode ?? null,
    fileSize: stat.size,
    sha256: sha256File(outPath),
    builtAt: new Date().toISOString(),
    path: path.relative(repoRoot, outPath),
    apkArchives: app.apkArchives || 0,
    note: app.apkArchives
      ? `Latest AAB only. ${app.apkArchives} older APK(s) remain sideload archives.`
      : null,
  };

  await fs.writeFile(path.join(outDir, 'latest.json'), JSON.stringify(meta, null, 2) + '\n');
  console.log(`\nAAB: ${outPath} (${stat.size} bytes)`);
  console.log(`SHA-256: ${meta.sha256}\n`);
  return meta;
}

const args = process.argv.slice(2).filter((a) => a !== '--sync');
const buildAll = args.includes('--all');
const slugs = buildAll ? config.apps.map((a) => a.slug) : args.filter((a) => !a.startsWith('--'));

if (!slugs.length) {
  console.error('Usage: node scripts/play/build-aab.mjs [--sync] <slug> | --all');
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
  /* fresh */
}
const bySlug = new Map(catalog.apps.map((a) => [a.slug, a]));
for (const meta of results) bySlug.set(meta.slug, meta);
catalog.apps = [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
catalog.generatedAt = new Date().toISOString();
await fs.writeFile(catalogPath, JSON.stringify(catalog, null, 2) + '\n');

console.log(`\n${'='.repeat(50)}`);
console.log(`Built: ${results.length}/${slugs.length}`);
if (failures.length) console.log(`Failed: ${failures.join(', ')}`);
console.log(`Catalog: ${path.relative(repoRoot, catalogPath)}`);
console.log(`${'='.repeat(50)}\n`);

if (failures.length) process.exit(1);
