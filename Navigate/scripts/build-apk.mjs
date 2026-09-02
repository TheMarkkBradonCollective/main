#!/usr/bin/env node
/**
 * Build Navigate APK with Capacitor + Android Auto car service.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { createWriteStream, existsSync, readFileSync } from 'node:fs';
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
    console.log('Installing Android cmdline-tools…');
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
  run(sdkmanager, [
    '--sdk_root=' + sdkRoot,
    'platform-tools',
    'platforms;android-34',
    'build-tools;34.0.0',
  ]);
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
            storePassword 'mbcnavigate'
            keyAlias 'navigate'
            keyPassword 'mbcnavigate'
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

  const manifestPath = path.join(androidRoot, 'app/src/main/AndroidManifest.xml');
  let manifest = await fs.readFile(manifestPath, 'utf8');

  if (!manifest.includes('NavigateCarAppService')) {
    const serviceBlock = `
        <service
            android:name=".car.NavigateCarAppService"
            android:exported="true"
            android:label="Navigate">
            <intent-filter>
                <action android:name="androidx.car.app.CarAppService" />
                <category android:name="androidx.car.app.category.NAVIGATION" />
            </intent-filter>
            <meta-data
                android:name="androidx.car.app.minCarApiLevel"
                android:value="1" />
        </service>

        <meta-data
            android:name="com.google.android.gms.car.application"
            android:resource="@xml/automotive_app_desc" />`;

    manifest = manifest.replace('</application>', `${serviceBlock}\n    </application>`);
    await fs.writeFile(manifestPath, manifest);
  }

  const resXml = path.join(androidRoot, 'app/src/main/res/xml/automotive_app_desc.xml');
  await fs.mkdir(path.dirname(resXml), { recursive: true });
  await fs.copyFile(
    path.join(root, 'android-templates/res/xml/automotive_app_desc.xml'),
    resXml
  );

  const carDest = path.join(androidRoot, 'app/src/main/java/com/themarkkbradoncollective/navigate/car');
  await fs.mkdir(carDest, { recursive: true });
  await fs.copyFile(
    path.join(root, 'android-templates/car/NavigateCarAppService.kt'),
    path.join(carDest, 'NavigateCarAppService.kt')
  );
  await fs.copyFile(
    path.join(root, 'android-templates/car/NavigateCarSession.kt'),
    path.join(carDest, 'NavigateCarSession.kt')
  );

  const keystore = path.join(androidRoot, 'navigate-release.keystore');
  if (!existsSync(keystore)) {
    run('keytool', [
      '-genkeypair',
      '-v',
      '-keystore',
      keystore,
      '-alias',
      'navigate',
      '-keyalg',
      'RSA',
      '-keysize',
      '2048',
      '-validity',
      '10000',
      '-storepass',
      'mbcnavigate',
      '-keypass',
      'mbcnavigate',
      '-dname',
      'CN=Navigate, OU=MBC, O=The Markk Brandon Collective, L=Sacramento, ST=CA, C=US',
    ]);
  }
}

async function sha256File(filePath) {
  const hash = createHash('sha256');
  hash.update(readFileSync(filePath));
  return hash.digest('hex');
}

async function updateVersionJson(apkPath) {
  const stat = await fs.stat(apkPath);
  const sha256 = await sha256File(apkPath);
  const publicApk = path.join(root, 'public', 'navigate.apk');
  const versioned = path.join(root, 'public', `navigate-v${versionName}.apk`);
  await fs.copyFile(apkPath, publicApk);
  await fs.copyFile(apkPath, versioned);

  const versionJson = {
    name: 'Navigate',
    version: versionName,
    updatedAt: new Date().toISOString(),
    pwa: true,
    apk: {
      ready: true,
      packageId: appId,
      name: appName,
      label: `${appName} v${versionName}`,
      version: versionName,
      versionCode,
      url: '/navigate.apk',
      downloadName: `Navigate-v${versionName}.apk`,
      versionedUrl: `/navigate-v${versionName}.apk`,
      fileSize: stat.size,
      sha256,
      releaseNotes: `Navigate v${versionName} — custom GPS with OpenStreetMap routing and Android Auto navigation shell.`,
      themeColor: '#0d1b2a',
      backgroundColor: '#0d1b2a',
      icon: '/icon-512.png',
      archives: [],
    },
  };

  await fs.writeFile(path.join(root, 'public/version.json'), JSON.stringify(versionJson, null, 2) + '\n');
  console.log(`\nAPK: ${publicApk} (${stat.size} bytes)\nSHA-256: ${sha256}`);
}

// Build flow
run('npm', ['run', 'build'], { cwd: root });

if (!existsSync(path.join(root, 'android'))) {
  run('npx', ['cap', 'add', 'android'], { cwd: root });
}

run('npx', ['cap', 'sync', 'android'], { cwd: root });
await patchAndroidProject();

const gradlew = path.join(root, 'android', 'gradlew');
run(gradlew, ['assembleRelease'], { cwd: path.join(root, 'android') });

const apkCandidates = [
  path.join(root, 'android/app/build/outputs/apk/release/app-release.apk'),
  path.join(root, 'android/app/build/outputs/apk/release/app-release-unsigned.apk'),
];

let builtApk = null;
for (const candidate of apkCandidates) {
  if (existsSync(candidate)) {
    builtApk = candidate;
    break;
  }
}

if (!builtApk) throw new Error('APK not found after build');
await updateVersionJson(builtApk);
