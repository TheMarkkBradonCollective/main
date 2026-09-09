#!/usr/bin/env node
/**
 * Build Navigate signed AAB (same flow as build-apk.mjs but bundleRelease).
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { createWriteStream, existsSync, mkdirSync, readFileSync, cpSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const versionName = pkg.version || '1.0.0';
const versionCode = String(versionName)
  .split('.')
  .map((n) => Number.parseInt(n, 10) || 0)
  .reduce((acc, n, i) => acc + n * 10 ** (4 - i * 2), 0);
const appId = 'com.themarkkbradoncollective.navigate';
const appName = 'Navigate';
const sdkRoot = process.env.ANDROID_HOME || path.join(os.homedir(), 'android-sdk');
const javaHome =
  process.env.JAVA_HOME ||
  (existsSync('/usr/lib/jvm/java-21-openjdk-amd64')
    ? '/usr/lib/jvm/java-21-openjdk-amd64'
    : process.env.JAVA_HOME);

function run(cmd, args, opts = {}) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, {
    stdio: 'inherit',
    env: {
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
    },
    ...opts,
  });
  if (r.status !== 0) {
    throw new Error(`Command failed (${r.status}): ${cmd} ${args.join(' ')}`);
  }
}

async function download(url, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  await pipeline(res.body, createWriteStream(dest));
}

async function ensureSdk() {
  const sdkmanager = path.join(sdkRoot, 'cmdline-tools', 'latest', 'bin', 'sdkmanager');
  if (!existsSync(sdkmanager)) {
    const zip = path.join(os.tmpdir(), 'cmdtools.zip');
    await download(
      'https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip',
      zip
    );
    const extract = path.join(os.tmpdir(), `cmdtools-${Date.now()}`);
    run('unzip', ['-q', '-o', zip, '-d', extract]);
    await fs.mkdir(path.join(sdkRoot, 'cmdline-tools'), { recursive: true });
    run('mv', [path.join(extract, 'cmdline-tools'), path.join(sdkRoot, 'cmdline-tools', 'latest')]);
  }
  run(sdkmanager, ['--sdk_root=' + sdkRoot, 'platform-tools', 'platforms;android-34', 'build-tools;34.0.0']);
}

async function patchAndroidProject() {
  const androidRoot = path.join(root, 'android');
  const appBuild = path.join(androidRoot, 'app/build.gradle');
  let gradle = await fs.readFile(appBuild, 'utf8');

  if (!gradle.includes('androidx.car.app')) {
    gradle = gradle.replace(
      'dependencies {',
      "dependencies {\n    implementation 'androidx.car.app:app:1.4.0'\n"
    );
  }

  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "${versionName}"`);

  if (!gradle.includes('signingConfigs')) {
    gradle = gradle.replace(
      'android {',
      `android {
    signingConfigs {
        release {
            storeFile file('../navigate-release.keystore')
            storePassword '${process.env.NAVIGATE_KEYSTORE_PASSWORD || 'mbcnavigate'}'
            keyAlias 'navigate'
            keyPassword '${process.env.NAVIGATE_KEY_PASSWORD || 'mbcnavigate'}'
        }
    }`
    );
    gradle = gradle.replace(
      'buildTypes {',
      `buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
        }`
    );
  }

  await fs.writeFile(appBuild, gradle);

  const keystore = path.join(androidRoot, 'navigate-release.keystore');
  if (!existsSync(keystore)) {
    run('keytool', [
      '-genkeypair', '-v', '-keystore', keystore, '-alias', 'navigate',
      '-keyalg', 'RSA', '-keysize', '2048', '-validity', '10000',
      '-storepass', process.env.NAVIGATE_KEYSTORE_PASSWORD || 'mbcnavigate',
      '-keypass', process.env.NAVIGATE_KEY_PASSWORD || 'mbcnavigate',
      '-dname', 'CN=Navigate, OU=MBC, O=The Markk Brandon Collective, L=Sacramento, ST=CA, C=US',
    ]);
  }
}

async function sha256File(filePath) {
  const hash = createHash('sha256');
  hash.update(readFileSync(filePath));
  return hash.digest('hex');
}

run('npm', ['run', 'build'], { cwd: root });

const capConfig = path.join(root, 'capacitor.config.json');
if (!existsSync(capConfig)) {
  writeFileSync(
    capConfig,
    JSON.stringify(
      {
        appId,
        appName,
        webDir: 'dist',
        server: { androidScheme: 'https' },
      },
      null,
      2
    ) + '\n'
  );
}

if (!existsSync(path.join(root, 'android'))) {
  run('npx', ['cap', 'add', 'android'], { cwd: root });
}
run('npx', ['cap', 'sync', 'android'], { cwd: root });
await patchAndroidProject();
await ensureSdk();

const gradlew = path.join(root, 'android', 'gradlew');
run(gradlew, ['bundleRelease'], { cwd: path.join(root, 'android') });

const builtAab = path.join(root, 'android/app/build/outputs/bundle/release/app-release.aab');
if (!existsSync(builtAab)) throw new Error('AAB not found after build');

const releaseDir = path.join(root, 'release');
mkdirSync(releaseDir, { recursive: true });
const dest = path.join(releaseDir, `navigate-v${versionName}.aab`);
cpSync(builtAab, dest);

const mainAabs = path.resolve(root, '..', 'aabs', 'navigate');
mkdirSync(mainAabs, { recursive: true });
cpSync(dest, path.join(mainAabs, `navigate-v${versionName}.aab`));

const stat = await fs.stat(dest);
const sha256 = await sha256File(dest);
const meta = {
  slug: 'navigate',
  name: appName,
  packageId: appId,
  version: versionName,
  versionCode,
  fileSize: stat.size,
  sha256,
  builtAt: new Date().toISOString(),
  path: path.relative(path.resolve(root, '..'), dest),
};
await fs.writeFile(path.join(mainAabs, 'latest.json'), JSON.stringify(meta, null, 2) + '\n');

console.log(`\nAAB: ${dest} (${stat.size} bytes)\nSHA-256: ${sha256}\n`);
