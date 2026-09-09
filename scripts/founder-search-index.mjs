/**
 * Build a unified search index for Founder Bridge.
 * Indexes catalog metadata, local pages, live site text, certs, APKs, and GitHub READMEs.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const TYPE_LABELS = {
  app: 'App',
  feature: 'Feature',
  role: 'Role',
  apk: 'APK',
  cert: 'Certificate',
  page: 'Site page',
  ops: 'Ops / health',
  github: 'GitHub',
  release: 'Release notes',
  site: 'Live site',
  internal: 'Internal',
};

const LOCAL_PAGES = [
  { path: 'index.html', title: 'Front Page', url: '../index.html', site: 'mbc-site' },
  { path: 'about/index.html', title: 'About', url: '../about/', site: 'mbc-site' },
  { path: 'apps/index.html', title: 'The Classifieds', url: '../apps/', site: 'mbc-site' },
  { path: 'security/index.html', title: 'Security Showcase', url: '../security/', site: 'mbc-site' },
  { path: 'download/index.html', title: 'MBC App Store', url: '../download/', site: 'mbc-site' },
  { path: 'support/index.html', title: 'Support / GoFundMe', url: '../support/', site: 'mbc-site' },
  { path: 'request/index.html', title: 'Hire Me', url: '../request/', site: 'mbc-site' },
  { path: 'founder/index.html', title: 'Founder Bridge', url: './', site: 'mbc-site' },
];

function normalizeBase(url) {
  let base = url.replace(/\/$/, '');
  if (base === 'https://guardr.co') base = 'https://www.guardr.co';
  return base;
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function clip(text, max = 1200) {
  const clean = String(text || '').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max)}…`;
}

function pushDoc(docs, doc) {
  if (!doc.title && !doc.body) return;
  docs.push({
    id: doc.id,
    type: doc.type,
    typeLabel: TYPE_LABELS[doc.type] || doc.type,
    title: doc.title || 'Untitled',
    body: clip(doc.body || ''),
    app: doc.app || null,
    appName: doc.appName || null,
    section: doc.section || null,
    url: doc.url || null,
    source: doc.source || null,
    tags: doc.tags || [],
  });
}

function indexProject(docs, app) {
  const baseTags = [app.slug, app.section, app.status].filter(Boolean);

  pushDoc(docs, {
    id: `app-${app.slug}`,
    type: 'app',
    title: app.name,
    body: [app.tagline, app.heroLine, app.description, app.statusLabel, app.listing]
      .filter(Boolean)
      .join(' · '),
    app: app.slug,
    appName: app.name,
    section: app.section,
    url: app.url,
    source: 'My-Projects.json',
    tags: [...baseTags, 'app', ...(app.platforms || [])],
  });

  for (const feature of app.features || []) {
    pushDoc(docs, {
      id: `feature-${app.slug}-${feature.title}`.replace(/\s+/g, '-').toLowerCase(),
      type: 'feature',
      title: `${feature.title} — ${app.name}`,
      body: feature.blurb || '',
      app: app.slug,
      appName: app.name,
      section: app.section,
      url: app.url,
      source: 'My-Projects.json',
      tags: [...baseTags, 'feature'],
    });
  }

  for (const step of app.steps || []) {
    pushDoc(docs, {
      id: `step-${app.slug}-${step.title}`.replace(/\s+/g, '-').toLowerCase(),
      type: 'feature',
      title: `${step.title} — ${app.name}`,
      body: step.blurb || '',
      app: app.slug,
      appName: app.name,
      section: app.section,
      url: app.url,
      source: 'My-Projects.json',
      tags: [...baseTags, 'how-to', 'step'],
    });
  }

  for (const role of app.roles || []) {
    pushDoc(docs, {
      id: `role-${app.slug}-${role.id || role.title}`.replace(/\s+/g, '-').toLowerCase(),
      type: 'role',
      title: `${role.title} — ${app.name}`,
      body: role.blurb || '',
      app: app.slug,
      appName: app.name,
      section: app.section,
      url: app.url,
      source: 'My-Projects.json',
      tags: [...baseTags, 'role', role.id || role.title],
    });
  }

  for (const [i, detail] of (app.readDetails || []).entries()) {
    pushDoc(docs, {
      id: `detail-${app.slug}-${i}`,
      type: 'app',
      title: `${app.name} — detail ${i + 1}`,
      body: detail,
      app: app.slug,
      appName: app.name,
      section: app.section,
      url: app.url,
      source: 'My-Projects.json',
      tags: [...baseTags, 'description'],
    });
  }

  for (const highlight of app.highlights || []) {
    pushDoc(docs, {
      id: `highlight-${app.slug}-${highlight}`.replace(/\s+/g, '-').toLowerCase(),
      type: 'app',
      title: `${app.name} — ${highlight}`,
      body: highlight,
      app: app.slug,
      appName: app.name,
      section: app.section,
      url: app.url,
      source: 'My-Projects.json',
      tags: [...baseTags, 'highlight'],
    });
  }

  if (app.github) {
    pushDoc(docs, {
      id: `github-${app.slug}`,
      type: 'github',
      title: `${app.name} — GitHub`,
      body: `Repository ${app.github}. ${app.githubPrivate ? 'Private repo.' : 'Public repo.'}`,
      app: app.slug,
      appName: app.name,
      section: app.section,
      url: app.github,
      source: 'My-Projects.json',
      tags: [...baseTags, 'github', 'code'],
    });
  }
}

function indexMetricsApp(docs, app) {
  const health = app.health || {};
  const apk = app.apk || {};
  const gh = app.githubStats || {};

  pushDoc(docs, {
    id: `ops-${app.slug}`,
    type: 'ops',
    title: `${app.name} — ops snapshot`,
    body: [
      `Health: ${health.health || 'unknown'}`,
      `Web version: ${health.version || '—'}`,
      `APK: ${apk.status || '—'} ${apk.version ? `v${apk.version}` : ''}`,
      `Package: ${apk.packageId || '—'}`,
      `Last deploy: ${health.updatedAt || '—'}`,
      `GitHub push: ${gh.pushedAt || '—'}`,
      `Open issues: ${gh.openIssues ?? '—'}`,
      app.admin ? `Admin: ${app.admin.label} ${app.admin.url}` : '',
    ]
      .filter(Boolean)
      .join(' · '),
    app: app.slug,
    appName: app.name,
    section: app.section,
    url: app.admin?.url || app.url,
    source: 'founder-metrics',
    tags: [app.slug, app.section, 'ops', 'health', health.health, apk.status].filter(Boolean),
  });

  if (app.admin) {
    pushDoc(docs, {
      id: `admin-${app.slug}`,
      type: 'ops',
      title: `${app.admin.label} — ${app.name}`,
      body: `Staff / admin portal for ${app.name}.`,
      app: app.slug,
      appName: app.name,
      section: app.section,
      url: app.admin.url,
      source: 'founder-metrics',
      tags: [app.slug, 'admin', 'staff', 'portal'],
    });
  }
}

function indexApkCatalog(docs, catalog) {
  if (!catalog) return;

  if (catalog.storeApp) {
    const s = catalog.storeApp;
    pushDoc(docs, {
      id: 'apk-mbc-store',
      type: 'apk',
      title: `${s.name} v${s.version}`,
      body: [s.releaseNotes, s.packageId, s.downloadName].filter(Boolean).join(' · '),
      app: 'mbc-store',
      appName: s.name,
      section: 'internal',
      url: '../download/',
      source: 'apk-catalog.json',
      tags: ['apk', 'android', 'store', s.packageId],
    });
  }

  for (const app of catalog.apps || []) {
    const a = app.android;
    if (!a) continue;
    pushDoc(docs, {
      id: `apk-${app.slug}`,
      type: 'apk',
      title: `${app.name} Android ${a.version ? `v${a.version}` : ''}`,
      body: [
        a.releaseNotes,
        a.packageId,
        a.downloadName,
        `Status: ${a.status}`,
        `Source: ${a.source || 'unknown'}`,
        a.sha256 ? `SHA256: ${a.sha256}` : '',
      ]
        .filter(Boolean)
        .join(' · '),
      app: app.slug,
      appName: app.name,
      section: app.section,
      url: app.webUrl,
      source: 'apk-catalog.json',
      tags: ['apk', 'android', app.slug, a.packageId, a.status].filter(Boolean),
    });
  }
}

function indexCerts(docs, certs) {
  if (!certs) return;

  for (const cert of certs.training || []) {
    pushDoc(docs, {
      id: `cert-${cert.id}`,
      type: 'cert',
      title: cert.title,
      body: [
        cert.badge,
        cert.course,
        cert.serial,
        cert.issuer,
        cert.license,
        cert.completed,
        `${cert.hours || ''} hours`,
        ...(cert.modules || []),
      ]
        .filter(Boolean)
        .join(' · '),
      app: 'sss',
      appName: 'Signature Security Specialist',
      section: 'security',
      url: '../security/',
      source: 'security/certs.json',
      tags: ['cert', 'bsis', 'training', cert.badge, cert.course].filter(Boolean),
    });
  }

  for (const op of certs.operators || []) {
    pushDoc(docs, {
      id: `operator-${op.id || op.name}`.replace(/\s+/g, '-').toLowerCase(),
      type: 'cert',
      title: `${op.name || 'Operator'} credentials`,
      body: [op.role, op.license, op.expires, op.notes].filter(Boolean).join(' · '),
      app: 'sss',
      appName: 'Signature Security Specialist',
      section: 'security',
      url: '../security/',
      source: 'security/certs.json',
      tags: ['cert', 'operator', 'credentials', op.role].filter(Boolean),
    });
  }
}

async function indexLocalPages(docs) {
  for (const page of LOCAL_PAGES) {
    const filePath = join(root, page.path);
    if (!existsSync(filePath)) continue;
    try {
      const html = await readFile(filePath, 'utf8');
      const text = stripHtml(html);
      pushDoc(docs, {
        id: `page-${page.path.replace(/[/.]/g, '-')}`,
        type: 'page',
        title: `${page.title} — MBC site`,
        body: text,
        app: page.site,
        appName: 'MBC Main Site',
        section: 'internal',
        url: page.url,
        source: page.path,
        tags: ['page', 'mbc-site', page.title.toLowerCase()],
      });
    } catch {
      /* skip */
    }
  }
}

async function fetchSiteText(base) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(base, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { Accept: 'text/html' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    return stripHtml(html);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function indexLiveSites(docs, apps) {
  const seen = new Set();
  for (const app of apps) {
    if (!app.url || seen.has(app.url)) continue;
    seen.add(app.url);
    const base = normalizeBase(app.url);
    process.stdout.write(`  ↳ crawl ${app.slug}… `);
    const text = await fetchSiteText(base);
    if (!text) {
      console.log('skip');
      continue;
    }
    console.log('ok');
    pushDoc(docs, {
      id: `site-${app.slug}`,
      type: 'site',
      title: `${app.name} — live homepage`,
      body: text,
      app: app.slug,
      appName: app.name,
      section: app.section,
      url: app.url,
      source: base,
      tags: [app.slug, 'live', 'homepage', app.section].filter(Boolean),
    });
  }
}

async function fetchGithubReadme(githubUrl, headers) {
  try {
    const url = new URL(githubUrl);
    const [, owner, repo] = url.pathname.split('/');
    if (!owner || !repo) return null;
    const api = `https://api.github.com/repos/${owner}/${repo.replace(/\.git$/, '')}/readme`;
    const res = await fetch(api, { headers, redirect: 'follow' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.content) return null;
    const decoded = Buffer.from(data.content, data.encoding === 'base64' ? 'base64' : 'utf8').toString(
      'utf8'
    );
    return decoded.replace(/^#+\s+/gm, '').trim();
  } catch {
    return null;
  }
}

async function indexGithubReadmes(docs, apps, githubHeaders) {
  if (!githubHeaders) return;
  for (const app of apps) {
    if (!app.github) continue;
    process.stdout.write(`  ↳ readme ${app.slug}… `);
    const readme = await fetchGithubReadme(app.github, githubHeaders);
    if (!readme) {
      console.log('skip');
      continue;
    }
    console.log('ok');
    pushDoc(docs, {
      id: `readme-${app.slug}`,
      type: 'github',
      title: `${app.name} — README`,
      body: readme,
      app: app.slug,
      appName: app.name,
      section: app.section,
      url: app.github,
      source: 'GitHub README',
      tags: [app.slug, 'github', 'readme', 'docs'],
    });
  }
}

export async function buildFounderSearchIndex({
  projects,
  metricsApps,
  catalog,
  certs,
  githubHeaders,
}) {
  const docs = [];

  for (const app of projects) indexProject(docs, app);
  for (const app of metricsApps) indexMetricsApp(docs, app);
  indexApkCatalog(docs, catalog);
  indexCerts(docs, certs);

  console.log('→ Indexing local MBC pages…');
  await indexLocalPages(docs);

  console.log('→ Crawling live homepages…');
  await indexLiveSites(docs, metricsApps);

  if (githubHeaders) {
    console.log('→ Pulling GitHub READMEs…');
    const allApps = [
      ...projects.map((p) => ({ slug: p.slug, name: p.name, section: p.section, github: p.github })),
      ...metricsApps.filter((a) => a.internal),
    ];
    await indexGithubReadmes(docs, allApps, githubHeaders);
  }

  const types = {};
  for (const doc of docs) {
    types[doc.type] = (types[doc.type] || 0) + 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    note: 'Auto-generated search index for Founder Bridge — re-run npm run sync-founder-bridge.',
    documentCount: docs.length,
    types,
    typeLabels: TYPE_LABELS,
    documents: docs,
  };
}
