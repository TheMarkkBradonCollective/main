#!/usr/bin/env node
/**
 * Founder Bridge — aggregate health, version, and ops signals from every MBC app.
 * Reads My-Projects.json + apk-catalog.json, probes live deployments and GitHub.
 * Output: founder-metrics.json (static dashboard feed for /founder/).
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const projectsPath = join(root, 'My-Projects.json');
const apkCatalogPath = join(root, 'apk-catalog.json');
const siteVersionPath = join(root, 'version.json');

const SECTION_LABELS = {
  community: 'Community',
  lifestyle: 'Lifestyle & Culture',
  social: 'Social & Connection',
  navigation: 'Navigation',
  security: 'Security',
  internal: 'Internal / Ops',
};

const ADMIN_PORTALS = {
  guardr: { label: 'Guardr Staff', path: '/staff' },
  findr: { label: 'Findr Staff Portal', path: '/staff' },
  sss: { label: 'SSS Staff', path: '/staff' },
};

const INTERNAL_PROJECTS = [
  {
    slug: 'mbc-site',
    name: 'MBC Main Site',
    tagline: 'Newspaper portfolio & distribution hub',
    url: 'https://themarkkbradoncollective.github.io/main/',
    section: 'internal',
    status: 'live',
    github: 'https://github.com/TheMarkkBradonCollective/main',
    githubPrivate: false,
    adminPath: '/founder/',
    adminLabel: 'Founder Bridge',
  },
  {
    slug: 'mbc-store',
    name: 'MBC App Store',
    tagline: 'Android sideload catalog & native store app',
    url: 'https://themarkkbradoncollective.github.io/main/download/',
    section: 'internal',
    status: 'live',
    github: 'https://github.com/TheMarkkBradonCollective/main',
    githubPrivate: false,
    localOnly: true,
  },
  {
    slug: 'navigate',
    name: 'Navigate',
    tagline: 'Custom GPS with Android Auto',
    url: 'https://navigate-tmbc.vercel.app',
    section: 'navigation',
    status: 'live',
    github: 'https://github.com/TheMarkkBradonCollective/Navigate',
    githubPrivate: true,
    localRepo: 'Navigate',
  },
  {
    slug: 'my-happy-plate',
    name: 'My Happy Plate',
    tagline: 'Food truck pre-orders & kitchen board',
    url: 'https://themarkkbradoncollective.github.io/my-happy-plate/',
    section: 'internal',
    status: 'live',
    github: 'https://github.com/TheMarkkBradonCollective/my-happy-plate',
    githubPrivate: false,
    adminPath: '/kitchen/',
    adminLabel: 'Kitchen Board',
    localRepo: 'my-happy-plate',
  },
  {
    slug: 'the-rink-studios',
    name: 'The Rink Studios',
    tagline: 'Venue concept redesign',
    url: 'https://themarkkbradoncollective.github.io/the-rink-studios/',
    section: 'internal',
    status: 'concept',
    github: 'https://github.com/TheMarkkBradonCollective/the-rink-studios',
    githubPrivate: false,
    localRepo: 'The-Rink-Studios',
  },
];

function normalizeBase(url) {
  let base = url.replace(/\/$/, '');
  if (base === 'https://guardr.co') base = 'https://www.guardr.co';
  return base;
}

function parseGithubRepo(githubUrl) {
  if (!githubUrl) return null;
  try {
    const url = new URL(githubUrl);
    if (url.hostname !== 'github.com') return null;
    const [, owner, repo] = url.pathname.split('/');
    if (!owner || !repo) return null;
    return { owner, repo: repo.replace(/\.git$/, '') };
  } catch {
    return null;
  }
}

function getGithubToken() {
  const fromEnv = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (fromEnv) return fromEnv;
  try {
    return execSync('gh auth token', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

const githubToken = getGithubToken();

function githubHeaders(extra = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...extra,
  };
  if (githubToken) headers.Authorization = `Bearer ${githubToken}`;
  return headers;
}

async function fetchJson(url, opts = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 12_000);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: opts.headers,
    });
    if (!res.ok) return { ok: false, status: res.status };
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('json')) return { ok: false, status: res.status, error: 'not-json' };
    const data = await res.json();
    return { ok: true, status: res.status, data };
  } catch (err) {
    return { ok: false, error: err.name === 'AbortError' ? 'timeout' : err.message };
  } finally {
    clearTimeout(timeout);
  }
}

async function probeSite(base) {
  const versionUrl = `${base}/version.json`;
  const version = await fetchJson(versionUrl);
  let siteOk = false;
  try {
    const res = await fetch(base, { method: 'HEAD', redirect: 'follow' });
    siteOk = res.ok;
  } catch {
    siteOk = false;
  }

  const manifest = version.ok ? version.data : null;
  const health =
    version.ok && siteOk ? 'healthy' : siteOk ? 'partial' : version.ok ? 'version-only' : 'down';

  return {
    health,
    siteOk,
    versionOk: version.ok,
    version: manifest?.version || manifest?.label || null,
    updatedAt: manifest?.updatedAt || null,
    pwa: Boolean(manifest?.pwa),
    apkReady: manifest?.apk?.ready !== false && Boolean(manifest?.apk),
    apkVersion: manifest?.apk?.version || null,
    homepage: manifest?.homepage || null,
    repository: manifest?.repository || null,
  };
}

async function fetchGithubStats(githubUrl) {
  const repo = parseGithubRepo(githubUrl);
  if (!repo) return null;

  const base = `https://api.github.com/repos/${repo.owner}/${repo.repo}`;
  const repoRes = await fetchJson(base, { headers: githubHeaders() });
  if (!repoRes.ok) {
    return { reachable: false, private: null };
  }

  const d = repoRes.data;
  let openIssues = null;
  const issuesRes = await fetchJson(`${base}/issues?state=open&per_page=1`, {
    headers: { ...githubHeaders(), Accept: 'application/vnd.github+json' },
  });
  if (issuesRes.ok && Array.isArray(issuesRes.data)) {
    // GitHub doesn't return total in body; use Link header approximation or separate call
    openIssues = issuesRes.data.length;
    try {
      const full = await fetch(`${base}/issues?state=open&per_page=100`, {
        headers: githubHeaders(),
      });
      if (full.ok) {
        const list = await full.json();
        openIssues = list.length;
      }
    } catch {
      /* keep partial */
    }
  }

  return {
    reachable: true,
    private: d.private,
    defaultBranch: d.default_branch,
    stars: d.stargazers_count,
    forks: d.forks_count,
    openIssues,
    pushedAt: d.pushed_at,
    updatedAt: d.updated_at,
    visibility: d.private ? 'private' : 'public',
    url: d.html_url,
  };
}

function apkEntryForSlug(catalog, slug) {
  if (!catalog?.apps) return null;
  return catalog.apps.find((a) => a.slug === slug) || null;
}

function buildAdminLink(app) {
  const portal = ADMIN_PORTALS[app.slug];
  if (portal) {
    const base = normalizeBase(app.url);
    return { label: portal.label, url: `${base}${portal.path}` };
  }
  if (app.adminPath) {
    const base = app.url?.endsWith('/') ? app.url.slice(0, -1) : app.url;
    return { label: app.adminLabel || 'Admin', url: `${base}${app.adminPath}` };
  }
  return null;
}

function rolesSummary(app) {
  if (!Array.isArray(app.roles)) return [];
  return app.roles.map((r) => r.title || r.id);
}

async function buildAppEntry(app, catalog) {
  const base = normalizeBase(app.url);
  const probe = await probeSite(base);
  const github = app.github ? await fetchGithubStats(app.github) : null;
  const apk = apkEntryForSlug(catalog, app.slug);
  const admin = buildAdminLink(app);

  return {
    slug: app.slug,
    name: app.name,
    tagline: app.tagline,
    section: app.section,
    sectionLabel: SECTION_LABELS[app.section] || app.section,
    status: app.status || 'live',
    statusLabel: app.statusLabel || app.status,
    url: app.url,
    github: app.github || null,
    githubPrivate: Boolean(app.githubPrivate),
    listing: app.listing || null,
    platforms: app.platforms || [],
    roles: rolesSummary(app),
    admin,
    showcaseUrl: `../apps/showcase/?app=${app.slug}`,
    health: probe,
    apk: apk
      ? {
          status: apk.android?.status || 'unknown',
          version: apk.android?.version || apk.webVersion || null,
          versionCode: apk.android?.versionCode || null,
          packageId: apk.android?.packageId || null,
          source: apk.android?.source || null,
        }
      : probe.apkReady
        ? { status: 'available', version: probe.apkVersion, source: 'live' }
        : { status: 'web-only', version: probe.version },
    githubStats: github,
    sisters: app.sisters || [],
  };
}

async function buildInternalEntry(project, catalog, siteVersion) {
  let probe = { health: 'unknown', siteOk: false, versionOk: false, version: null, updatedAt: null };
  if (project.localOnly && project.slug === 'mbc-site') {
    probe = {
      health: 'healthy',
      siteOk: true,
      versionOk: true,
      version: siteVersion?.version || null,
      updatedAt: siteVersion?.updatedAt || null,
      pwa: true,
      apkReady: Boolean(siteVersion?.apk),
      apkVersion: null,
    };
  } else if (project.url) {
    probe = await probeSite(normalizeBase(project.url));
  }

  const github = project.github ? await fetchGithubStats(project.github) : null;
  const apk = apkEntryForSlug(catalog, project.slug);
  const admin = buildAdminLink(project);

  return {
    slug: project.slug,
    name: project.name,
    tagline: project.tagline,
    section: project.section,
    sectionLabel: SECTION_LABELS[project.section] || project.section,
    status: project.status || 'live',
    statusLabel: project.status === 'concept' ? 'Concept' : 'Internal',
    url: project.url,
    github: project.github || null,
    githubPrivate: Boolean(project.githubPrivate),
    listing: null,
    platforms: ['phone', 'tablet', 'chromebook'],
    roles: [],
    admin,
    showcaseUrl: project.slug === 'mbc-site' ? '../index.html' : null,
    health: probe,
    apk: apk
      ? {
          status: apk.android?.status || 'unknown',
          version: apk.android?.version || null,
          versionCode: apk.android?.versionCode || null,
          packageId: apk.android?.packageId || null,
          source: apk.android?.source || null,
        }
      : project.slug === 'mbc-store' && catalog?.storeApp
        ? {
            status: 'available',
            version: catalog.storeApp.version,
            versionCode: catalog.storeApp.versionCode,
            packageId: catalog.storeApp.packageId,
            source: 'mirror',
          }
        : { status: probe.apkReady ? 'available' : 'web-only', version: probe.version },
    githubStats: github,
    localRepo: project.localRepo || null,
    internal: true,
  };
}

function summarize(apps) {
  const total = apps.length;
  const live = apps.filter((a) => a.status === 'live').length;
  const healthy = apps.filter((a) => a.health?.health === 'healthy').length;
  const apkAvailable = apps.filter((a) => a.apk?.status === 'available').length;
  const withAdmin = apps.filter((a) => a.admin).length;
  const sections = {};
  for (const app of apps) {
    sections[app.section] = (sections[app.section] || 0) + 1;
  }
  return { total, live, healthy, apkAvailable, withAdmin, sections };
}

const projects = JSON.parse(await readFile(projectsPath, 'utf8'));
let catalog = null;
try {
  catalog = JSON.parse(await readFile(apkCatalogPath, 'utf8'));
} catch {
  console.warn('⚠ apk-catalog.json not found — APK columns will be partial.');
}

let siteVersion = null;
try {
  siteVersion = JSON.parse(await readFile(siteVersionPath, 'utf8'));
} catch {
  /* optional */
}

console.log(`\nFounder Bridge — syncing ${projects.length} classified apps + internal projects…`);
if (githubToken) {
  console.log('GitHub token found — repo stats enabled.\n');
} else {
  console.log('No GITHUB_TOKEN — site probes only (no GitHub stats).\n');
}

const classified = [];
for (const app of projects) {
  process.stdout.write(`→ ${app.slug}… `);
  try {
    const entry = await buildAppEntry(app, catalog);
    classified.push(entry);
    console.log(entry.health?.health || 'ok');
  } catch (err) {
    console.log('FAIL');
    console.error(`  ${err.message}`);
  }
}

const internal = [];
for (const project of INTERNAL_PROJECTS) {
  process.stdout.write(`→ [internal] ${project.slug}… `);
  try {
    const entry = await buildInternalEntry(project, catalog, siteVersion);
    internal.push(entry);
    console.log(entry.health?.health || 'ok');
  } catch (err) {
    console.log('FAIL');
    console.error(`  ${err.message}`);
  }
}

const apps = [...classified, ...internal];
const summary = summarize(apps);

const payload = {
  generatedAt: new Date().toISOString(),
  note: 'Auto-generated by scripts/sync-founder-bridge.mjs — re-run npm run sync-founder-bridge or npm run update.',
  githubTokenUsed: Boolean(githubToken),
  summary,
  sectionLabels: SECTION_LABELS,
  apps,
};

const outPaths = [join(root, 'founder-metrics.json'), join(root, 'public', 'founder-metrics.json')];
await mkdir(join(root, 'public'), { recursive: true });
for (const dest of outPaths) {
  await writeFile(dest, JSON.stringify(payload, null, 2) + '\n');
}

console.log(
  `\nWrote founder-metrics.json — ${summary.healthy}/${summary.total} healthy · ${summary.apkAvailable} APKs · ${summary.withAdmin} admin portals\n`
);
