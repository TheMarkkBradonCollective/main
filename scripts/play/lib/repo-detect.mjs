#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export function detectProjectType(projectRoot) {
  const androidDir = path.join(projectRoot, 'android');
  if (!existsSync(androidDir)) return 'none';

  if (
    existsSync(path.join(androidDir, 'twa-manifest.json')) ||
    existsSync(path.join(projectRoot, 'twa-manifest.json'))
  ) {
    return 'twa';
  }

  const pkgPath = path.join(projectRoot, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps['@capacitor/android'] || deps['@capacitor/core']) {
      return 'capacitor';
    }
    if (pkg.scripts?.['build:apk'] || pkg.scripts?.['build:aab']) {
      return 'capacitor';
    }
  }

  if (existsSync(path.join(androidDir, 'gradlew'))) {
    return 'gradle';
  }

  return 'unknown';
}

export function readProjectVersion(projectRoot) {
  const versionJson = path.join(projectRoot, 'public/version.json');
  if (existsSync(versionJson)) {
    try {
      const data = JSON.parse(readFileSync(versionJson, 'utf8'));
      return {
        version: data.version || data.apk?.version,
        versionCode: data.apk?.versionCode ?? data.versionCode,
        packageId: data.apk?.packageId,
      };
    } catch {
      /* ignore */
    }
  }

  const pkgPath = path.join(projectRoot, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      return { version: pkg.version };
    } catch {
      /* ignore */
    }
  }

  return {};
}
