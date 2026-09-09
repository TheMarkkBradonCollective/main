#!/usr/bin/env node
/**
 * Generate per-repo AAB build files for copying into each GitHub app repo.
 *
 * Usage:
 *   node scripts/play/scaffold-repo-aab.mjs           # all apps with APKs
 *   node scripts/play/scaffold-repo-aab.mjs strainverse friendr
 *
 * Output: play-scaffolds/{slug}/scripts/build-aab.mjs
 *         play-scaffolds/{slug}/.github/workflows/build-aab.yml
 *         play-scaffolds/{slug}/README-AAB.md
 */
import { cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const config = JSON.parse(await readFile(path.join(__dirname, 'play-apps.json'), 'utf8'));
const outRoot = path.join(root, 'play-scaffolds');
const templateScript = path.join(__dirname, 'templates/repo-build-aab.mjs');
const templateWorkflow = path.join(__dirname, 'templates/github-workflow-build-aab.yml');

const args = process.argv.slice(2);
const slugs = args.length ? args : config.apps.map((a) => a.slug);

const workflowTemplate = existsSync(templateWorkflow)
  ? readFileSync(templateWorkflow, 'utf8')
  : '';

for (const slug of slugs) {
  const app = config.apps.find((a) => a.slug === slug);
  if (!app) {
    console.warn(`Skip unknown slug: ${slug}`);
    continue;
  }
  if (app.slug === 'mbc-store') {
    console.log(`Skip ${slug} — builds from main repo download/android`);
    continue;
  }

  const dest = path.join(outRoot, slug);
  mkdirSync(path.join(dest, 'scripts'), { recursive: true });
  mkdirSync(path.join(dest, '.github/workflows'), { recursive: true });

  cpSync(templateScript, path.join(dest, 'scripts/build-aab.mjs'));

  const workflow = workflowTemplate
    .replaceAll('{{APP_NAME}}', app.name)
    .replaceAll('{{SLUG}}', app.slug)
    .replaceAll('{{PACKAGE_ID}}', app.packageId);
  await writeFile(path.join(dest, '.github/workflows/build-aab.yml'), workflow);

  const readme = `# ${app.name} — AAB build

Copy these files into the **${app.github?.split('/').pop() || slug}** repo root:

\`\`\`
scripts/build-aab.mjs          → scripts/build-aab.mjs
.github/workflows/build-aab.yml → .github/workflows/build-aab.yml
\`\`\`

Add to \`package.json\`:

\`\`\`json
"build:aab": "node scripts/build-aab.mjs"
\`\`\`

## GitHub secrets (repo Settings → Secrets)

| Secret | Value |
|--------|-------|
| \`MBC_UPLOAD_KEYSTORE_BASE64\` | base64 of \`mbc-upload.keystore\` |
| \`MBC_UPLOAD_KEYSTORE_PASSWORD\` | keystore password |
| \`MBC_UPLOAD_KEY_PASSWORD\` | key password |

Generate base64:
\`\`\`bash
base64 -w0 secrets/mbc-upload.keystore
\`\`\`

## Package

- **Package ID:** \`${app.packageId}\`
- **Current APK version:** ${app.version || 'see version.json'}
${app.apkArchives ? `- **Historical APK archives:** ${app.apkArchives} (sideload only — Play gets latest AAB)` : ''}

## Local build

\`\`\`bash
export MBC_UPLOAD_KEYSTORE_PASSWORD='your-password'
export MBC_UPLOAD_KEY_PASSWORD='your-password'
npm run build:aab
\`\`\`

Output: \`release/${slug}-v*.aab\`
`;
  await writeFile(path.join(dest, 'README-AAB.md'), readme);
  console.log(`→ play-scaffolds/${slug}/`);
}

console.log(`\nDone. Copy each folder into its GitHub repo, or run from main:\n  npm run play:build:all\n`);
