#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

export const sdkRoot = process.env.ANDROID_HOME || path.join(os.homedir(), 'android-sdk');

export const javaHome =
  process.env.JAVA_HOME ||
  (existsSync('/usr/lib/jvm/java-21-openjdk-amd64')
    ? '/usr/lib/jvm/java-21-openjdk-amd64'
    : process.env.JAVA_HOME);

export function androidEnv(extra = {}) {
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
    ...extra,
  };
}

export function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    stdio: opts.stdio ?? 'inherit',
    env: androidEnv(opts.env),
    cwd: opts.cwd,
    encoding: opts.encoding,
  });
  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${cmd} ${args.join(' ')}`);
  }
  return result;
}

async function download(url, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  await pipeline(res.body, createWriteStream(dest));
}

export async function ensureAndroidSdk() {
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

  acceptAndroidLicenses();
  run(sdkmanager, [
    '--sdk_root=' + sdkRoot,
    'platform-tools',
    'platforms;android-34',
    'build-tools;34.0.0',
  ]);
}

function acceptAndroidLicenses() {
  const sdkmanager = path.join(sdkRoot, 'cmdline-tools', 'latest', 'bin', 'sdkmanager');
  if (!existsSync(sdkmanager)) return;

  const licensesDir = path.join(sdkRoot, 'licenses');
  mkdirSync(licensesDir, { recursive: true });
  const hashes = [
    '24333f8a63b6825ea9c5514f83c2829b04d27b0a',
    'd56f5187479451eabf01fb78af6dfcb131a6481e',
    '84831b9409646a918e30573bab4c9c91346d8abd',
  ];
  for (const hash of hashes) {
    writeFileSync(path.join(licensesDir, hash), `${hash}\n`);
  }

  spawnSync(sdkmanager, [`--sdk_root=${sdkRoot}`, '--licenses'], {
    input: 'y\n'.repeat(64),
    stdio: ['pipe', 'inherit', 'inherit'],
    env: androidEnv(),
  });
}

export function findAabOutput(androidDir) {
  const bundleDir = path.join(androidDir, 'app/build/outputs/bundle/release');
  if (!existsSync(bundleDir)) return null;
  const candidates = ['app-release.aab', 'app.aab'];
  for (const name of candidates) {
    const full = path.join(bundleDir, name);
    if (existsSync(full)) return full;
  }
  return null;
}
