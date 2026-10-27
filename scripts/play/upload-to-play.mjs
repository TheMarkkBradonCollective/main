#!/usr/bin/env node
/**
 * Upload signed AABs to Google Play Console via the Android Publisher API.
 *
 * Prerequisites:
 *   1. Google Play Developer account (themarkkbrandoncollective@gmail.com)
 *   2. Google Cloud project with Android Publisher API enabled
 *   3. Service account JSON key linked in Play Console → Users & permissions
 *
 * Usage:
 *   export PLAY_SERVICE_ACCOUNT_JSON=/path/to/service-account.json
 *   node scripts/play/upload-to-play.mjs navigate
 *   node scripts/play/upload-to-play.mjs --all --track internal
 */
import fs from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const configPath = path.join(__dirname, 'play-apps.json');
const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

function parseArgs(argv) {
  const track = argv.includes('--track')
    ? argv[argv.indexOf('--track') + 1]
    : config.defaultTrack || 'internal';
  const all = argv.includes('--all');
  const slugs = all
    ? config.apps.map((a) => a.slug)
    : argv.filter((a) => !a.startsWith('--') && a !== track);
  return { track, slugs };
}

async function getAuth() {
  const keyFile = process.env.PLAY_SERVICE_ACCOUNT_JSON;
  const keyJson = process.env.PLAY_SERVICE_ACCOUNT_KEY;

  if (!keyFile && !keyJson) {
    throw new Error(
      'Set PLAY_SERVICE_ACCOUNT_JSON (path to JSON key) or PLAY_SERVICE_ACCOUNT_KEY (inline JSON)'
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials: keyJson ? JSON.parse(keyJson) : undefined,
    keyFile: keyFile || undefined,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  return auth;
}

async function loadAabMeta(app) {
  const latestPath = path.join(repoRoot, config.outputDir, app.slug, 'latest.json');
  if (!existsSync(latestPath)) {
    throw new Error(`No AAB built for ${app.slug}. Run: npm run play:build -- ${app.slug}`);
  }
  const meta = JSON.parse(await fs.readFile(latestPath, 'utf8'));
  const aabPath = path.join(repoRoot, meta.path);
  if (!existsSync(aabPath)) {
    throw new Error(`AAB file missing: ${meta.path}`);
  }
  return { meta, aabPath };
}

async function uploadApp(androidPublisher, app, track, dryRun) {
  const { meta, aabPath } = await loadAabMeta(app);
  console.log(`\n→ ${app.name} (${app.packageId})`);
  console.log(`  AAB: ${meta.path} v${meta.version}`);
  console.log(`  Track: ${track}`);

  if (dryRun) {
    console.log('  (dry run — skipping upload)');
    return;
  }

  const editRes = await androidPublisher.edits.insert({
    packageName: app.packageId,
  });
  const editId = editRes.data.id;
  if (!editId) throw new Error('Failed to create Play edit');

  const uploadRes = await androidPublisher.edits.bundles.upload({
    packageName: app.packageId,
    editId,
    media: {
      mimeType: 'application/octet-stream',
      body: createReadStream(aabPath),
    },
  });

  const versionCode = uploadRes.data.versionCode;
  if (!versionCode) throw new Error('Upload succeeded but no versionCode returned');

  await androidPublisher.edits.tracks.update({
    packageName: app.packageId,
    editId,
    track,
    requestBody: {
      releases: [
        {
          status: 'completed',
          versionCodes: [String(versionCode)],
        },
      ],
    },
  });

  await androidPublisher.edits.commit({
    packageName: app.packageId,
    editId,
  });

  console.log(`  ✓ Uploaded versionCode ${versionCode} to ${track}`);
}

async function main() {
  const { track, slugs } = parseArgs(process.argv.slice(2));
  const dryRun = process.argv.includes('--dry-run');

  if (!slugs.length) {
    console.error('Usage: node scripts/play/upload-to-play.mjs <slug> | --all [--track internal]');
    process.exit(1);
  }

  const auth = dryRun ? null : await getAuth();
  const androidPublisher = google.androidpublisher({ version: 'v3', auth });

  const failures = [];
  for (const slug of slugs) {
    const app = config.apps.find((a) => a.slug === slug);
    if (!app) {
      console.error(`Unknown slug: ${slug}`);
      failures.push(slug);
      continue;
    }
    try {
      await uploadApp(androidPublisher, app, track, dryRun);
    } catch (err) {
      console.error(`  ✗ ${err.message}`);
      failures.push(slug);
    }
  }

  if (failures.length) {
    console.error(`\nFailed uploads: ${failures.join(', ')}`);
    process.exit(1);
  }
  console.log('\n✓ Play upload complete\n');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
