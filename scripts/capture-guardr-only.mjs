#!/usr/bin/env node
import { chromium } from 'playwright';
import { mkdir, readdir, unlink, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '..', 'images', 'screenshots');
await mkdir(outDir, { recursive: true });
for (const f of await readdir(outDir)) {
  if (f.startsWith('guardr-') && f.endsWith('.jpg')) await unlink(path.join(outDir, f));
}

const userDataDir = `/tmp/guardr-pw-${Date.now()}`;
const ctx = await chromium.launchPersistentContext(userDataDir, {
  headless: true,
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = ctx.pages()[0] || (await ctx.newPage());

async function dismiss() {
  // Use exact text — "Later" must not match "Now or later"
  for (const name of ['Later', 'Not now', 'Maybe later']) {
    try {
      const el = page.getByRole('button', { name, exact: true }).first();
      if (await el.isVisible({ timeout: 250 })) await el.click({ timeout: 800 });
    } catch {
      /* next */
    }
  }
  try {
    const el = page.locator('[aria-label="Close"]').first();
    if (await el.isVisible({ timeout: 250 })) await el.click({ timeout: 800 });
  } catch {
    /* ignore */
  }
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('body *')) {
      try {
        const st = getComputedStyle(el);
        const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (
          (st.position === 'fixed' || st.position === 'sticky') &&
          txt.length < 420 &&
          el.children.length < 30 &&
          (/INSTALL APP|Add .+ to your home screen/i.test(txt) ||
            (/Install/i.test(txt) && /Later|Not now|Show iOS guide/i.test(txt)))
        ) {
          el.style.setProperty('display', 'none', 'important');
        }
      } catch {
        /* ignore */
      }
    }
  });
}

function isMarketing(body, url) {
  return (
    !/[?&]auth=/.test(url || '') &&
    /Post coverage\. Hire licensed guards/i.test(body) &&
    /Log in/i.test(body) &&
    /Sign up/i.test(body) &&
    !/Back to role selection/i.test(body) &&
    !/Create your (client|guard) account/i.test(body)
  );
}

async function waitMarketing() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const url = attempt % 2 === 0 ? 'https://www.guardr.co/explore' : 'https://www.guardr.co/';
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page
      .waitForFunction(() => {
        const body = (document.body?.innerText || '').replace(/\s+/g, ' ').trim();
        return body.length > 80 && !/^beta v[\d.]+$/i.test(body);
      }, { timeout: 25000 })
      .catch(() => {});

    // Stabilization — SPA sometimes hops into ?auth= after first paint
    for (let s = 0; s < 6; s++) {
      await page.waitForTimeout(700);
      const body = await page.evaluate(() => (document.body?.innerText || '').replace(/\s+/g, ' ').trim());
      const href = page.url();
      if (isMarketing(body, href)) {
        await dismiss();
        return true;
      }
      if (/[?&]auth=/.test(href) || /Back to role selection/i.test(body)) {
        await page.getByText('Back to role selection').first().click({ force: true }).catch(() => {});
        await page.waitForTimeout(600);
        await page.getByText('Back to Home').first().click({ force: true }).catch(() => {});
        await page.waitForTimeout(900);
        // Hard reset query
        await page.evaluate(() => {
          if (location.search.includes('auth=')) history.replaceState({}, '', location.pathname === '/' ? '/explore' : location.pathname);
        });
        await page.goto('https://www.guardr.co/explore', { waitUntil: 'domcontentloaded' }).catch(() => {});
        await page.waitForTimeout(2000);
      }
    }
  }
  await dismiss();
  const body = await page.evaluate(() => document.body.innerText);
  return isMarketing(body, page.url());
}

let n = 1;
const shots = [];
const seen = new Set();
async function shot(label) {
  await dismiss();
  await page.waitForTimeout(350);
  const body = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').trim();
  const scroll = await page.evaluate(() => Math.round(scrollY / 180));
  const key = body.slice(0, 260) + '|' + scroll;
  if (seen.has(key)) {
    console.log('skip', label);
    return;
  }
  seen.add(key);
  const file = path.join(outDir, `guardr-${n}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 84, fullPage: false });
  const title = await page.title();
  const h1 = await page.evaluate(() => document.querySelector('h1')?.innerText?.trim() || '');
  const caption = `${h1 || label} — ${body.slice(0, 100)}`;
  console.log('✓', `guardr-${n}.jpg`, label, page.url().replace('https://www.guardr.co', '') || '/', '::', body.slice(0, 70));
  shots.push({ file: `images/screenshots/guardr-${n}.jpg`, caption, url: page.url(), title, h1 });
  n++;
}

const ok = await waitMarketing();
console.log('marketing ready', ok, page.url());
await shot('Home hero');

for (let i = 0; i < 5; i++) {
  await page.evaluate(() => window.scrollBy(0, Math.floor(innerHeight * 0.8)));
  await page.waitForTimeout(650);
  await shot('Home scroll ' + (i + 1));
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);

if (await page.getByRole('button', { name: 'Open menu' }).isVisible().catch(() => false)) {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.waitForTimeout(500);
  await shot('Menu open');
  await page.getByRole('button', { name: 'Close menu' }).click().catch(() => {});
}

async function clickFromHome(name, exact = false) {
  await waitMarketing();
  const btn = page.getByRole('button', { name, exact }).first();
  if (!(await btn.isVisible({ timeout: 2500 }).catch(() => false))) {
    console.log('missing', name, page.url());
    return;
  }
  await btn.click();
  await page.waitForTimeout(1600);
  await dismiss();
  await shot(name);
}

await clickFromHome('Log in', true);
if (await page.getByText('Log in as guard').isVisible().catch(() => false)) {
  await page.getByText('Log in as guard').click();
  await page.waitForTimeout(1400);
  await shot('Guard sign in');
}
await clickFromHome('Log in', true);
if (await page.getByText('Log in as client').isVisible().catch(() => false)) {
  await page.getByText('Log in as client').click();
  await page.waitForTimeout(1400);
  await shot('Client sign in');
}
await clickFromHome('Sign up', true);
if (await page.getByText('Sign up as guard').isVisible().catch(() => false)) {
  await page.getByText('Sign up as guard').click();
  await page.waitForTimeout(1400);
  await shot('Guard sign up');
}
await clickFromHome('Sign up', true);
if (await page.getByText('Sign up as client').isVisible().catch(() => false)) {
  await page.getByText('Sign up as client').click();
  await page.waitForTimeout(1400);
  await shot('Client sign up');
}
await clickFromHome('Post a job');
await clickFromHome('Find work as a guard');

for (const [q, label] of [
  ['/?auth=sign-in', 'auth sign-in'],
  ['/?auth=sign-up', 'auth sign-up'],
  ['/?auth=sign-up&ar=client', 'auth client signup'],
  ['/?auth=sign-up&ar=guard', 'auth guard signup'],
  ['/download', 'download'],
]) {
  await page.goto('https://www.guardr.co' + q, { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => {
      const body = (document.body?.innerText || '').replace(/\s+/g, ' ').trim();
      return body.length > 80 && !/^beta v[\d.]+$/i.test(body);
    }, { timeout: 20000 })
    .catch(() => {});
  await page.waitForTimeout(1000);
  await dismiss();
  await shot(label);
}

console.log('TOTAL', shots.length);
let prior = { apps: [] };
try {
  prior = JSON.parse(await readFile(path.join(outDir, 'multi-capture-summary.json'), 'utf8'));
} catch {
  /* none */
}
const by = Object.fromEntries((prior.apps || []).map((a) => [a.slug, a]));
by.guardr = { slug: 'guardr', count: shots.length, errors: [], files: shots };
const merged = ['spiritsverse', 'guardr', 'sss', 'strainverse'].map((s) => by[s]).filter(Boolean);
await writeFile(
  path.join(outDir, 'multi-capture-summary.json'),
  JSON.stringify(
    { generatedAt: new Date().toISOString(), apps: merged, files: merged.flatMap((a) => a.files || []) },
    null,
    2
  ) + '\n'
);
await ctx.close();
