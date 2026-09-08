#!/usr/bin/env node
/**
 * Expand My-Projects.json with org repos and mark catalog apps APK-only.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'My-Projects.json');
const DOWNLOAD = 'https://themarkkbradoncollective.github.io/main/download/';

const PRIVATE_SLUGS = new Set(['buynothing', 'sss']);

const NEW_APPS = [
  {
    slug: 'buffalofree',
    theme: 'buynothing',
    name: 'TheBuffaloFree',
    tagline: 'Give Freely. Ask Kindly.',
    section: 'community',
    listing: 'Listing #009',
    github: 'TheBuffaloFree',
    description: 'Community-powered free gifting for Buffalo neighbors — Android app.',
    iconSources: [
      'https://raw.githubusercontent.com/TheMarkkBradonCollective/TheBuffaloFree/main/public/logo.png',
      'https://raw.githubusercontent.com/TheMarkkBradonCollective/TheBuffaloFree/main/public/Logo.jpeg',
    ],
  },
  {
    slug: 'hangman',
    theme: 'default',
    name: 'HangMan',
    tagline: 'HangMan The Game',
    section: 'lifestyle',
    listing: 'Listing #010',
    github: 'HangMan',
    description: 'Classic HangMan — Android APK from The Markk Brandon Collective.',
    iconSources: ['https://raw.githubusercontent.com/TheMarkkBradonCollective/HangMan/main/icon.png'],
  },
  {
    slug: 'runr',
    theme: 'default',
    name: 'Runr',
    tagline: 'Delivery platform',
    section: 'lifestyle',
    listing: 'Listing #012',
    github: 'Runr',
    description: 'Runr delivery platform — Android APK.',
    iconSources: ['https://raw.githubusercontent.com/TheMarkkBradonCollective/Runr/main/public/icon.png'],
  },
  {
    slug: 'dlvrd',
    theme: 'default',
    name: 'Dlvrd',
    tagline: 'Delivery companion',
    section: 'lifestyle',
    listing: 'Listing #014',
    github: 'Dlvrd',
    description: 'Dlvrd delivery companion — Android APK.',
    iconSources: ['https://raw.githubusercontent.com/TheMarkkBradonCollective/Dlvrd/main/public/icon.png'],
  },
  {
    slug: 'brandr',
    theme: 'default',
    name: 'Brandr',
    tagline: 'Brand tools',
    section: 'lifestyle',
    listing: 'Listing #015',
    github: 'Brandr',
    description: 'Brandr — Android APK.',
    iconSources: ['https://raw.githubusercontent.com/TheMarkkBradonCollective/Brandr/main/public/icon.png'],
  },
  {
    slug: 'checkdeck',
    theme: 'default',
    name: 'CheckDeck',
    tagline: 'Checklists & decks',
    section: 'lifestyle',
    listing: 'Listing #016',
    github: 'CheckDeck',
    description: 'CheckDeck — Android APK.',
    iconSources: ['https://raw.githubusercontent.com/TheMarkkBradonCollective/CheckDeck/main/public/icon.png'],
  },
  {
    slug: 'myvenue',
    theme: 'default',
    name: 'MyVenue',
    tagline: 'Venue management',
    section: 'lifestyle',
    listing: 'Listing #017',
    github: 'MyVenue',
    description: 'MyVenue — Android APK.',
    iconSources: ['https://raw.githubusercontent.com/TheMarkkBradonCollective/MyVenue/main/public/icon.png'],
  },
  {
    slug: 'meus-them',
    theme: 'default',
    name: 'MeUs-Them',
    tagline: 'Social connection',
    section: 'social',
    listing: 'Listing #018',
    github: 'MeUs-Them',
    description: 'MeUs-Them — Android APK.',
    iconSources: ['https://raw.githubusercontent.com/TheMarkkBradonCollective/MeUs-Them/main/public/icon.png'],
  },
  {
    slug: 'groupdominoscore',
    theme: 'default',
    name: 'GroupDominoScore',
    tagline: 'Domino scoreboard',
    section: 'lifestyle',
    listing: 'Listing #019',
    github: 'GroupDominoScore',
    description: 'Group domino score tracking — Android APK.',
    iconSources: ['https://raw.githubusercontent.com/TheMarkkBradonCollective/GroupDominoScore/main/public/icon.png'],
  },
];

function githubIconFallback(repo) {
  return [
    `https://raw.githubusercontent.com/TheMarkkBradonCollective/${repo}/main/public/icon-512.png`,
    `https://raw.githubusercontent.com/TheMarkkBradonCollective/${repo}/main/public/icon.png`,
    `https://raw.githubusercontent.com/TheMarkkBradonCollective/${repo}/main/public/pwa-512.png`,
    `https://raw.githubusercontent.com/TheMarkkBradonCollective/${repo}/main/favicon.ico`,
  ];
}

function template(entry) {
  const repo = entry.github;
  return {
    slug: entry.slug,
    theme: entry.theme || 'default',
    ...(entry.verseAccent ? { verseAccent: entry.verseAccent, verseTint: entry.verseTint } : {}),
    name: entry.name,
    tagline: entry.tagline,
    url: `${DOWNLOAD}#${entry.slug}`,
    section: entry.section,
    listing: entry.listing,
    status: 'live',
    statusLabel: 'Active · APK',
    heroLine: entry.tagline,
    description: entry.description,
    features: [],
    screenshots: [],
    platforms: ['phone'],
    readDetails: [entry.description],
    highlights: ['Android APK · MBC App Store'],
    github: `https://github.com/TheMarkkBradonCollective/${repo}`,
    githubPrivate: false,
    apkOnly: true,
    iconSources: entry.iconSources?.length ? entry.iconSources : githubIconFallback(repo),
  };
}

const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const existingSlugs = new Set(catalog.map((a) => a.slug));

for (const app of catalog) {
  app.apkOnly = true;
  app.url = `${DOWNLOAD}#${app.slug}`;
  app.statusLabel = app.statusLabel?.replace(/Active · Free/i, 'Active · APK') || 'Active · APK';
  if (PRIVATE_SLUGS.has(app.slug)) {
    app.githubPrivate = true;
  }
  if (app.github) {
    const repo = app.github.split('/').pop();
    const ghIcons = githubIconFallback(repo);
    app.iconSources = [...new Set([...(app.iconSources || []).filter((u) => !u.includes('vercel.app')), ...ghIcons])];
  }
}

for (const entry of NEW_APPS) {
  if (existingSlugs.has(entry.slug)) continue;
  catalog.push(template(entry));
}

await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Catalog: ${catalog.length} apps (${NEW_APPS.length} new templates, apkOnly on all).`);
