#!/usr/bin/env node
/**
 * Regenerate The Classifieds grids in apps/index.html from My-Projects.json.
 * Security apps (section === "security") stay on /security/ only.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'My-Projects.json');
const classifiedsPath = join(root, 'apps', 'index.html');

const SECTIONS = [
  {
    id: 'community',
    title: 'Community',
    span: 'Free on purpose',
    intro: `
    <p class="intro-label">Why this exists</p>
    <p>Sacramento is home. I watched good stuff hit the curb while neighbors needed the same things — and every “free” app still wanted a cut somewhere. So I built something that stays free: give, ask, no selling, no flipping, no ads. The Android app adds live Go Get pickup. The same buy-nothing lane extends to other cities when neighbors ask for it.</p>`,
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle &amp; Culture',
    span: 'Boredom / fun / random ideas',
    intro: `
    <p class="intro-label">Why this exists</p>
    <p>StrainVerse, SpiritsVerse, Cookverse, GigOS, and the smaller builds here weren't born from a pitch deck. Culture stuff I wanted to play with — cannabis, drinks, cooking, live shows, games, delivery — turned into real apps with real backends, not throwaway demos. Still free to use where that applies. Still meant to get used.</p>`,
  },
  {
    id: 'social',
    title: 'Social &amp; Connection',
    span: 'Spite for paywalled apps',
    intro: `
    <p class="intro-label">Why this exists</p>
    <p>A lot of social apps weren't built for you — they were built for advertisers. Bots, fake profiles, data sold off, paywalls for basics. Friendr, Chatr, Findr, MeUs-Them, and MyVenue are my answer: consent first, free to use where possible, real databases, human moderation where it matters. Check them out. If they help, <a href="../support/">help keep them online</a>.</p>`,
  },
  {
    id: 'navigation',
    title: 'Navigation &amp; In-Car',
    span: 'GPS · Android Auto',
    intro: `
    <p class="intro-label">Why this exists</p>
    <p>Subscription map apps weren't the goal. Navigate is a custom GPS stack on OpenStreetMap with OSRM routing, plus Android Auto from the same AndroidAutoApps repo as YouCarPlay. Install from the MBC App Store when an APK is published, or open the live shell on the web.</p>`,
  },
];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusClass(status) {
  return status === 'dev' ? 'dev' : 'live';
}

function renderAd(app) {
  const statusLabel = app.statusLabel || (app.status === 'dev' ? 'In Development' : 'Active · Free');
  const visitUrl = app.url;
  const github = app.github;
  const githubBtn = github
    ? `<a class="btn" href="${escapeHtml(github)}" target="_blank" rel="noopener">GitHub</a>`
    : '';

  return `
    <article class="classified-ad">
      <p class="ad-number">${escapeHtml(app.listing || app.name)}</p>
      <img class="ad-thumb" src="../icons/apps/${escapeHtml(app.slug)}.png" width="64" height="64" alt="" loading="lazy">
      <h4>${escapeHtml(app.name)}</h4>
      <p class="ad-tagline">${escapeHtml(app.tagline || '')}</p>
      <p>${escapeHtml(app.description || '')}</p>
      <p class="ad-status ${statusClass(app.status)}">● ${escapeHtml(statusLabel)}</p>
      <div class="ad-links">
        <a class="btn btn-primary" href="./showcase/?app=${escapeHtml(app.slug)}">View details</a>
        ${visitUrl ? `<a class="btn" href="${escapeHtml(visitUrl)}" target="_blank" rel="noopener">Visit Site</a>` : ''}
        ${githubBtn}
      </div>
    </article>`;
}

function renderSection(section, apps) {
  const sectionApps = apps.filter((a) => a.section === section.id);
  if (!sectionApps.length) return '';

  return `
<section class="classified-section" id="${section.id}">
  <div class="classified-section-head">
    <h3>${section.title}</h3>
    <span>${section.span}</span>
  </div>
  <div class="classified-intro">
    ${section.intro.trim()}
  </div>
  <div class="classified-grid">
    ${sectionApps.map(renderAd).join('')}
  </div>
</section>`;
}

const projects = JSON.parse(await readFile(catalogPath, 'utf8'));
const publicApps = projects.filter((p) => p.section !== 'security');

const generated = SECTIONS.map((section) => renderSection(section, publicApps))
  .filter(Boolean)
  .join('\n');

let html = await readFile(classifiedsPath, 'utf8');
const begin = '<!-- CLASSIFIEDS:BEGIN -->';
const end = '<!-- CLASSIFIEDS:END -->';
const block = `${begin}\n${generated}\n${end}`;

if (html.includes(begin) && html.includes(end)) {
  html = html.replace(new RegExp(`${begin}[\\s\\S]*?${end}`), block);
} else {
  const movedMarker = '<section class="moved-security" id="security">';
  if (!html.includes(movedMarker)) {
    throw new Error('Could not find classifieds insertion point in apps/index.html');
  }
  html = html.replace(
    movedMarker,
    `${block}\n\n${movedMarker}`
  );
  // Remove old hard-coded sections (community through social) on first run
  html = html.replace(
    /<section class="classified-section" id="community">[\s\S]*?<section class="moved-security"/,
    `${begin}\n${generated}\n${end}\n\n<section class="moved-security"`
  );
}

await writeFile(classifiedsPath, html);
const counts = Object.fromEntries(
  SECTIONS.map((s) => [s.id, publicApps.filter((a) => a.section === s.id).length])
);
console.log(
  `\nClassifieds synced from My-Projects.json → apps/index.html (${publicApps.length} listings)\n` +
    SECTIONS.map((s) => `  ${s.id}: ${counts[s.id] || 0}`).join('\n') +
    '\n'
);
