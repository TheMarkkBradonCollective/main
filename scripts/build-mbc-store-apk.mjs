#!/usr/bin/env node
/**
 * Build a signed MBC Store release APK and copy it to apks/mbc-store/.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, createWriteStream, existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { pipeline } from 'node:stream/promises';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const androidRoot = join(root, 'download', 'android');
const keystorePath = join(androidRoot, 'mbc-store-release.keystore');
const sdkRoot = process.env.ANDROID_HOME || join(os.homedir(), 'android-sdk');
const javaHome =
  process.env.JAVA_HOME ||
  (existsSync('/usr/lib/jvm/java-21-openjdk-amd64')
    ? '/usr/lib/jvm/java-21-openjdk-amd64'
    : process.env.JAVA_HOME);

const STORE_PASS = process.env.MBC_STORE_KEYSTORE_PASS || 'mbcstore';
const KEY_ALIAS = 'mbcstore';
const versionName = '1.0.0';
const versionCode = 100;
const outName = `MBC-Store-v${versionName}.apk`;

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
        join(sdkRoot, 'cmdline-tools', 'latest', 'bin'),
        join(sdkRoot, 'platform-tools'),
        join(sdkRoot, 'build-tools', '34.0.0'),
        javaHome ? join(javaHome, 'bin') : '',
        process.env.PATH,
      ]
        .filter(Boolean)
        .join(':'),
    },
    ...opts,
  });
  if (r.status !== 0) {
    throw new Error(`Command failed (${r.status}): ${cmd} ${args.join(' ')}`);
  }
}

async function download(url, dest) {
  await mkdir(dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  await pipeline(res.body, createWriteStream(dest));
}

async function ensureSdk() {
  const sdkmanager = join(sdkRoot, 'cmdline-tools', 'latest', 'bin', 'sdkmanager');
  if (!existsSync(sdkmanager)) {
    console.log('Installing Android cmdline-tools…');
    const zip = join(os.tmpdir(), 'cmdtools.zip');
    await download(
      'https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip',
      zip
    );
    const extract = join(os.tmpdir(), `cmdtools-${Date.now()}`);
    run('unzip', ['-q', '-o', zip, '-d', extract]);
    await mkdir(join(sdkRoot, 'cmdline-tools'), { recursive: true });
    run('mv', [join(extract, 'cmdline-tools'), join(sdkRoot, 'cmdline-tools', 'latest')]);
  }
  run(sdkmanager, [
    `--sdk_root=${sdkRoot}`,
    'platform-tools',
    'platforms;android-34',
    'build-tools;34.0.0',
  ]);
  run('bash', [
    '-lc',
    `yes | ${sdkmanager} --sdk_root=${sdkRoot} --licenses >/dev/null`,
  ]);
}

async function ensureKeystore() {
  if (existsSync(keystorePath)) return;
  run('keytool', [
    '-genkeypair',
    '-v',
    '-keystore',
    keystorePath,
    '-alias',
    KEY_ALIAS,
    '-keyalg',
    'RSA',
    '-keysize',
    '2048',
    '-validity',
    '10000',
    '-storepass',
    STORE_PASS,
    '-keypass',
    STORE_PASS,
    '-dname',
    'CN=MBC Store, OU=MBC, O=The Markk Brandon Collective, L=Sacramento, ST=CA, C=US',
  ]);
}

async function ensureSigningConfig() {
  const gradlePath = join(androidRoot, 'app/build.gradle.kts');
  let gradle = await readFile(gradlePath, 'utf8');
  if (gradle.includes('signingConfigs')) return;

  gradle = gradle.replace(
    'android {',
    `android {
    signingConfigs {
        create("release") {
            storeFile = file("../mbc-store-release.keystore")
            storePassword = "${STORE_PASS}"
            keyAlias = "${KEY_ALIAS}"
            keyPassword = "${STORE_PASS}"
        }
    }`
  );
  gradle = gradle.replace(
    '    buildTypes {\n        release {\n            isMinifyEnabled = false',
    `    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = false`
  );
  await writeFile(gradlePath, gradle);
}

async function ensureLocalProperties() {
  await writeFile(join(androidRoot, 'local.properties'), `sdk.dir=${sdkRoot.replace(/\\/g, '/')}\n`);
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

await ensureSdk();
await ensureKeystore();
await ensureSigningConfig();
await ensureLocalProperties();

run(join(androidRoot, 'gradlew'), ['assembleRelease'], { cwd: androidRoot });

const built = join(androidRoot, 'app/build/outputs/apk/release/app-release.apk');
if (!existsSync(built)) {
  throw new Error(`Expected signed APK at ${built}`);
}

run('jarsigner', ['-verify', '-verbose', '-certs', built]);

const apksigner = [join(sdkRoot, 'build-tools', '34.0.0', 'apksigner')].find(existsSync)
  ? join(sdkRoot, 'build-tools', '34.0.0', 'apksigner')
  : null;
if (apksigner) {
  run(apksigner, ['verify', '--verbose', built]);
}

const destDir = join(root, 'apks', 'mbc-store');
await mkdir(destDir, { recursive: true });
const dest = join(destDir, outName);
copyFileSync(built, dest);

const sha256 = sha256File(dest);
console.log(`\n✓ Signed MBC Store APK → ${dest}`);
console.log(`  SHA-256: ${sha256}`);
console.log('  Run: npm run package-mbc-store-zip && npm run sync-apk-catalog');
