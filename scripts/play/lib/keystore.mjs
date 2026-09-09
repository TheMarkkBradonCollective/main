#!/usr/bin/env node
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { run } from './android-sdk.mjs';

export function resolveSigningConfig(signing, repoRoot) {
  const storePassword =
    process.env[signing.storePasswordEnv] ||
    signing.defaultStorePassword ||
    process.env.MBC_UPLOAD_KEYSTORE_PASSWORD ||
    'mbc-upload-2026';
  const keyPassword =
    process.env[signing.keyPasswordEnv] ||
    signing.defaultKeyPassword ||
    process.env.MBC_UPLOAD_KEY_PASSWORD ||
    storePassword;

  const keystorePath = path.isAbsolute(signing.keystore)
    ? signing.keystore
    : path.join(repoRoot, signing.keystore);

  return {
    keystorePath,
    alias: signing.alias,
    storePassword,
    keyPassword,
  };
}

export async function ensureKeystore(signing, repoRoot, appName) {
  const config = resolveSigningConfig(signing, repoRoot);
  if (existsSync(config.keystorePath)) return config;

  await fs.mkdir(path.dirname(config.keystorePath), { recursive: true });
  console.log(`Creating upload keystore at ${config.keystorePath}`);
  run('keytool', [
    '-genkeypair',
    '-v',
    '-keystore',
    config.keystorePath,
    '-alias',
    config.alias,
    '-keyalg',
    'RSA',
    '-keysize',
    '2048',
    '-validity',
    '10000',
    '-storepass',
    config.storePassword,
    '-keypass',
    config.keyPassword,
    '-dname',
    `CN=${appName}, OU=MBC, O=The Markk Brandon Collective, L=Sacramento, ST=CA, C=US`,
  ]);
  return config;
}

export async function writeKeystoreProperties(androidDir, signing, repoRoot) {
  const config = await ensureKeystore(signing, repoRoot, path.basename(androidDir));
  const propsPath = path.join(androidDir, 'keystore.properties');
  const relKeystore = path.relative(androidDir, config.keystorePath).replace(/\\/g, '/');
  const content = [
    `storeFile=${relKeystore}`,
    `storePassword=${config.storePassword}`,
    `keyAlias=${config.alias}`,
    `keyPassword=${config.keyPassword}`,
    '',
  ].join('\n');
  await fs.writeFile(propsPath, content);
  return propsPath;
}

export async function patchGradleSigning(androidDir) {
  const appBuildGradle = path.join(androidDir, 'app/build.gradle');
  const appBuildGradleKts = path.join(androidDir, 'app/build.gradle.kts');
  const target = existsSync(appBuildGradleKts) ? appBuildGradleKts : appBuildGradle;
  if (!existsSync(target)) {
    throw new Error(`No app/build.gradle(.kts) in ${androidDir}`);
  }

  let gradle = await fs.readFile(target, 'utf8');
  const isKts = target.endsWith('.kts');

  if (gradle.includes('keystore.properties')) return target;

  if (isKts) {
    if (!gradle.includes('import java.util.Properties')) {
      gradle = `import java.util.Properties\nimport java.io.FileInputStream\n\n${gradle}`;
    }
    const signingBlock = `
val keystorePropertiesFile = rootProject.file("keystore.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

`;
    gradle = gradle.replace(/android\s*\{/, `android {\n${signingBlock}`);
    if (!gradle.includes('signingConfigs')) {
      gradle = gradle.replace(
        /android\s*\{/,
        `android {
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
    }
    if (!gradle.includes('signingConfig = signingConfigs.getByName("release")')) {
      gradle = gradle.replace(
        /release\s*\{/,
        `release {
            signingConfig = signingConfigs.getByName("release")`
      );
    }
  } else {
    const signingBlock = `
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

`;
    gradle = gradle.replace(/android\s*\{/, `android {\n${signingBlock}`);
    if (!gradle.includes('signingConfigs')) {
      gradle = gradle.replace(
        /android\s*\{/,
        `android {
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
    }
    if (!gradle.includes('signingConfig signingConfigs.release')) {
      gradle = gradle.replace(/release\s*\{/, `release {
            signingConfig signingConfigs.release`);
    }
  }

  await fs.writeFile(target, gradle);
  return target;
}
