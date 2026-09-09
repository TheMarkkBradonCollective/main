#!/usr/bin/env node
/**
 * Drop into any MBC app repo as scripts/build-aab.mjs
 *
 * package.json:  "build:aab": "node scripts/build-aab.mjs"
 *
 * Env:
 *   MBC_UPLOAD_KEYSTORE_PASSWORD / MBC_UPLOAD_KEY_PASSWORD
 *   ANDROID_KEYSTORE_PATH  (optional)
 *   MBC_UPLOAD_KEYSTORE_BASE64  (CI — writes secrets/mbc-upload.keystore)
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const androidDir = path.join(root, 'android');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

const sdkRoot = process.env.ANDROID_HOME || path.join(os.homedir(), 'android-sdk');
const javaHome =
  process.env.JAVA_HOME ||
  (existsSync('/usr/lib/jvm/java-21-openjdk-amd64')
    ? '/usr/lib/jvm/java-21-openjdk-amd64'
    : undefined);

function androidEnv() {
  return {
    ...process.env,
    ANDROID_HOME: sdkRoot,
    ANDROID_SDK_ROOT: sdkRoot,
    JAVA_HOME: javaHome || process.env.JAVA_HOME,
    PATH: [
      path.join(sdkRoot, 'cmdline-tools', 'latest', 'bin'),
      path.join(sdkRoot, 'platform-tools'),
      javaHome ? path.join(javaHome, 'bin') : '',
      process.env.PATH,
    ]
      .filter(Boolean)
      .join(path.delimiter),
  };
}

function run(cmd, args, cwd = root) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd, env: androidEnv() });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

async function ensureKeystore() {
  const secretsDir = path.join(root, 'secrets');
  const keystorePath =
    process.env.ANDROID_KEYSTORE_PATH || path.join(secretsDir, 'mbc-upload.keystore');

  if (process.env.MBC_UPLOAD_KEYSTORE_BASE64) {
    mkdirSync(secretsDir, { recursive: true });
    writeFileSync(keystorePath, Buffer.from(process.env.MBC_UPLOAD_KEYSTORE_BASE64, 'base64'));
  }

  return {
    keystorePath,
    storePassword: process.env.MBC_UPLOAD_KEYSTORE_PASSWORD || 'mbc-upload-2026',
    keyPassword: process.env.MBC_UPLOAD_KEY_PASSWORD || process.env.MBC_UPLOAD_KEYSTORE_PASSWORD || 'mbc-upload-2026',
    keyAlias: process.env.ANDROID_KEY_ALIAS || 'mbc-upload',
  };
}

async function writeSigningProps(signing) {
  const rel = path.relative(androidDir, signing.keystorePath).replace(/\\/g, '/');
  await fs.writeFile(
    path.join(androidDir, 'keystore.properties'),
    [
      `storeFile=${rel.startsWith('..') ? rel : '../' + rel}`,
      `storePassword=${signing.storePassword}`,
      `keyAlias=${signing.keyAlias}`,
      `keyPassword=${signing.keyPassword}`,
      '',
    ].join('\n')
  );
}

async function patchGradleIfNeeded() {
  const appBuild = path.join(androidDir, 'app/build.gradle');
  const appBuildKts = path.join(androidDir, 'app/build.gradle.kts');
  const target = existsSync(appBuildKts) ? appBuildKts : appBuild;
  if (!existsSync(target)) return;

  let gradle = await fs.readFile(target, 'utf8');
  if (gradle.includes('keystore.properties')) return;

  if (target.endsWith('.kts')) {
    if (!gradle.includes('import java.util.Properties')) {
      gradle = `import java.util.Properties\nimport java.io.FileInputStream\n\n${gradle}`;
    }
    gradle = gradle.replace(
      /android\s*\{/,
      `android {
    val keystorePropertiesFile = rootProject.file("keystore.properties")
    val keystoreProperties = Properties()
    if (keystorePropertiesFile.exists()) {
        keystoreProperties.load(FileInputStream(keystorePropertiesFile))
    }
    signingConfigs {
        create("release") {
            if (keystorePropertiesFile.exists()) {
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
                storeFile = rootProject.file(keystoreProperties["storeFile"] as String)
                storePassword = keystoreProperties["storePassword"] as String
            }
        }
    }
`
    );
    gradle = gradle.replace(
      /release\s*\{/,
      `release {
            signingConfig = signingConfigs.getByName("release")`
    );
  } else {
    gradle = gradle.replace(
      /android\s*\{/,
      `android {
    def keystorePropertiesFile = rootProject.file("keystore.properties")
    def keystoreProperties = new Properties()
    if (keystorePropertiesFile.exists()) {
        keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
    }
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile rootProject.file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
`
    );
    gradle = gradle.replace(/release\s*\{/, `release {
            signingConfig signingConfigs.release`);
  }
  await fs.writeFile(target, gradle);
}

async function main() {
  const signing = await ensureKeystore();

  const hasVite =
    existsSync(path.join(root, 'vite.config.js')) || existsSync(path.join(root, 'vite.config.ts'));
  if (hasVite && pkg.scripts?.build) {
    run('npm', ['run', 'build']);
  } else if (pkg.scripts?.['build:apk']) {
    console.log('Note: using build:aab path (not build:apk)');
  }

  if (!existsSync(androidDir)) {
    run('npx', ['cap', 'add', 'android']);
  }
  if (existsSync(path.join(root, 'node_modules/@capacitor/cli'))) {
    run('npx', ['cap', 'sync', 'android']);
  }

  await writeSigningProps(signing);
  await patchGradleIfNeeded();

  const gradlew = path.join(androidDir, 'gradlew');
  run(gradlew, ['bundleRelease'], androidDir);

  const aab = path.join(androidDir, 'app/build/outputs/bundle/release/app-release.aab');
  if (!existsSync(aab)) {
    console.error('AAB not found after bundleRelease');
    process.exit(1);
  }

  const version = pkg.version || '1.0.0';
  const slug = (pkg.name || 'app').toLowerCase().replace(/\s+/g, '-');
  const outDir = path.join(root, 'release');
  mkdirSync(outDir, { recursive: true });
  const dest = path.join(outDir, `${slug}-v${version}.aab`);
  cpSync(aab, dest);
  console.log(`\nAAB: ${dest}\n`);
}

main();
