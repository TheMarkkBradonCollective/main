#!/usr/bin/env node
/**
 * Capture DISTINCT in-app mobile screenshots for showcase apps.
 * Viewport 390x844, dpr 2, JPEG q84, not fullPage.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'images', 'screenshots');

const VIEWPORT = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
};

async function settle(page, ms = 900) {
  await page.waitForTimeout(ms);
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
}

async function dismissNoise(page) {
  for (const name of ['Dismiss install prompt', 'Not now', 'Maybe later', 'Later', 'Skip', 'No thanks']) {
    try {
      const el = page.getByRole('button', { name, exact: true }).first();
      if (await el.isVisible({ timeout: 350 })) await el.click({ timeout: 1000 });
    } catch {
      /* next */
    }
  }
  for (const sel of ['[aria-label="Close"]', '[aria-label="Dismiss"]', '[aria-label="Close dialog"]']) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 350 })) await el.click({ timeout: 1000 });
    } catch {
      /* next */
    }
  }
  await page
    .evaluate(() => {
      const hide = (el) => {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
      };
      const isInstallChrome = (el) => {
        const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (!txt || txt.length > 420) return false;
        if (el.children.length > 30) return false;
        return (
          /INSTALL APP|Add .+ to your home screen|Add to Home Screen|Install StrainVerse|Install SpiritsVerse|Install Guardr|Dismiss install prompt/i.test(
            txt
          ) ||
          (/Install/i.test(txt) && /Later|Not now|Show iOS guide|Maybe later/i.test(txt))
        );
      };
      for (const el of document.querySelectorAll('[role="dialog"], [class*="install" i], [class*="pwa" i], [id*="install" i]')) {
        if (isInstallChrome(el)) hide(el);
      }
      for (const el of document.querySelectorAll('body *')) {
        try {
          const st = getComputedStyle(el);
          if ((st.position === 'fixed' || st.position === 'sticky') && isInstallChrome(el)) hide(el);
        } catch {
          /* ignore */
        }
      }
    })
    .catch(() => {});
}

async function waitForApp(page, readyText, timeout = 15000) {
  try {
    await page.getByText(readyText, { exact: false }).first().waitFor({ state: 'visible', timeout });
  } catch {
    await settle(page, 2500);
  }
}

async function contentFingerprint(page) {
  return page.evaluate(() => {
    const title = document.title || '';
    const h1 = document.querySelector('h1')?.innerText?.trim()?.slice(0, 120) || '';
    const h2 = [...document.querySelectorAll('h2')]
      .slice(0, 3)
      .map((e) => e.innerText.trim())
      .join(' | ')
      .slice(0, 120);
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const parts = [];
    for (const el of document.querySelectorAll('h1,h2,h3,p,button,a,label,li,span')) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
      if (r.width < 2 || r.height < 2) continue;
      const t = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
      if (t) parts.push(t.slice(0, 80));
      if (parts.length > 40) break;
    }
    const body = parts.join(' · ').slice(0, 500);
    const nav = [...document.querySelectorAll('button, [role="tab"]')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh;
      })
      .map((el) => (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 40))
      .filter(Boolean)
      .slice(0, 20)
      .join(',');
    const scroll = Math.round(window.scrollY);
    return { title, h1, h2, body, nav, scroll };
  });
}

function hashFp(fp) {
  // Visual distinctness from viewport-visible text (+ coarse scroll bucket)
  const scrollBucket = Math.round((fp.scroll || 0) / 200);
  return crypto
    .createHash('sha1')
    .update([fp.h1, fp.h2, fp.nav, fp.body.slice(0, 320), String(scrollBucket)].join('|'))
    .digest('hex')
    .slice(0, 16);
}

async function captionFrom(page, fp) {
  const main = fp.h1 || fp.h2 || fp.title || 'Screen';
  const hint = fp.body.slice(0, 80);
  return `${main} — ${hint}`.replace(/\s+/g, ' ').trim().slice(0, 160);
}

async function captureShot(page, slug, state) {
  await dismissNoise(page);
  await settle(page, 500);
  // Skip blank/loading shells — wait for hydration when needed
  const text = await page.evaluate(() => (document.body?.innerText || '').replace(/\s+/g, ' ').trim());
  if (!text || text.length < 40 || /^beta v[\d.]+$/i.test(text)) {
    await page
      .waitForFunction(
        () => {
          const body = (document.body?.innerText || '').replace(/\s+/g, ' ').trim();
          return body.length > 40 && !/^beta v[\d.]+$/i.test(body);
        },
        { timeout: 15000 }
      )
      .catch(() => {});
    await settle(page, 600);
    await dismissNoise(page);
  }
  const fp = await contentFingerprint(page);
  const text2 = fp.body;
  const full = await page.evaluate(() => (document.body?.innerText || '').replace(/\s+/g, ' ').trim());
  if ((!text2 || text2.length < 40) && (!full || full.length < 40 || /^beta v[\d.]+$/i.test(full))) {
    return null;
  }
  const key = hashFp(fp);
  if (state.seen.has(key)) return null;
  state.seen.add(key);

  const n = state.index++;
  const file = path.join(outDir, `${slug}-${n}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 84, fullPage: false });
  const entry = {
    file: path.relative(root, file),
    caption: await captionFrom(page, fp),
    url: page.url(),
    title: fp.title,
    h1: fp.h1,
  };
  state.files.push(entry);
  console.log(`✓ ${entry.file} — ${entry.caption}`);
  return entry;
}

async function clickRole(page, role, name, opts = {}) {
  try {
    const loc = page.getByRole(role, { name, exact: opts.exact ?? false }).first();
    if (await loc.isVisible({ timeout: opts.timeout ?? 1200 })) {
      await loc.click({ timeout: 2000 });
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const loc = page.locator(`button:has-text("${name}"), a:has-text("${name}"), [role="tab"]:has-text("${name}")`).first();
    if (await loc.isVisible({ timeout: 600 })) {
      await loc.click({ timeout: 2000 });
      return true;
    }
  } catch {
    /* no */
  }
  return false;
}

async function clearPrior(slug) {
  const files = await readdir(outDir).catch(() => []);
  for (const f of files) {
    if (f.startsWith(`${slug}-`) && f.endsWith('.jpg')) {
      await unlink(path.join(outDir, f)).catch(() => {});
    }
  }
}

async function captureSpiritsVerse(browser) {
  const slug = 'spiritsverse';
  await clearPrior(slug);
  const state = { index: 1, files: [], seen: new Set(), errors: [] };
  const ctx = await browser.newContext(VIEWPORT);
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);

  try {
    await page.goto('https://spiritsverse-tmbc.vercel.app/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await settle(page, 1800);
    await dismissNoise(page);
    await captureShot(page, slug, state); // landing / login

    // Try requested credentials first
    const tryLogin = async (email, password) => {
      await page.locator('input[type="email"]').fill(email).catch(() => {});
      await page.locator('input[type="password"]').fill(password).catch(() => {});
      await clickRole(page, 'button', 'Enter');
      await settle(page, 2500);
      await dismissNoise(page);
      const body = await page.evaluate(() => document.body?.innerText || '');
      return !/Invalid email or password/i.test(body) && !/Sign in with your Verse/i.test(body);
    };

    let loggedIn = await tryLogin('spiritsverse.showcase@example.com', 'ShotDemo123!');

    if (!loggedIn) {
      // Signup / Apply
      await clickRole(page, 'button', 'Apply');
      await settle(page, 700);
      await captureShot(page, slug, state);
      await page.locator('input[placeholder="John Doe"]').fill('Showcase Demo').catch(() => {});
      await page.locator('input[placeholder="johnnywalker"]').fill('spiritsdemo').catch(() => {});
      await page.locator('input[type="date"]').fill('1990-01-01').catch(() => {});
      await page.locator('input[type="email"]').fill('spiritsverse.showcase@example.com').catch(() => {});
      await page.locator('input[type="password"]').fill('ShotDemo123!').catch(() => {});
      await clickRole(page, 'button', 'Join Club');
      await settle(page, 3500);
      await dismissNoise(page);
      const body = await page.evaluate(() => document.body?.innerText || '');
      loggedIn = /drinks in the feed|Hello |SipStream|My Bar|Bar Crawl/i.test(body);
    }

    if (!loggedIn) {
      // Shared Verse account that works across apps
      await clickRole(page, 'button', 'Log In');
      await settle(page, 500);
      loggedIn = await tryLogin('strainverse.showcase3@example.com', 'ShotDemo123!');
    }

    await captureShot(page, slug, state);

    // Bottom nav tabs
    for (const tab of ['SpiritsVerse', 'Bar Crawl', 'SipStream', 'Local', 'My Bar']) {
      if (await clickRole(page, 'button', tab, { exact: true })) {
        await settle(page, 1200);
        await dismissNoise(page);
        await captureShot(page, slug, state);
      }
    }

    // Bar Crawl subviews
    if (await clickRole(page, 'button', 'Bar Crawl', { exact: true })) {
      await settle(page, 800);
      for (const sub of ['Explore', 'My Crawls', 'Active']) {
        if (await clickRole(page, 'button', sub, { exact: true })) {
          await settle(page, 900);
          await captureShot(page, slug, state);
        }
      }
      if (await clickRole(page, 'button', 'Plan a Crawl')) {
        await settle(page, 1000);
        await captureShot(page, slug, state);
      }
      if (await clickRole(page, 'button', 'Start this crawl')) {
        await settle(page, 1200);
        await captureShot(page, slug, state);
      }
    }

    // Drink encyclopedia filters / types
    if (await clickRole(page, 'button', 'SpiritsVerse', { exact: true })) {
      await settle(page, 1000);
      for (const filter of ['Citrus', 'Cocktails', 'Whiskey', 'Wine', 'Beer', 'Top rated']) {
        if (await clickRole(page, 'button', filter)) {
          await settle(page, 800);
          await captureShot(page, slug, state);
        }
      }
      // Open a drink card if present
      const drink = page.locator('text=/1800|Tequila|Wine|Cocktail/i').first();
      if (await drink.isVisible({ timeout: 800 }).catch(() => false)) {
        await drink.click().catch(() => {});
        await settle(page, 1200);
        await captureShot(page, slug, state);
      }
    }

    if (await clickRole(page, 'button', 'My Bar', { exact: true })) {
      await settle(page, 1000);
      await captureShot(page, slug, state);
      for (const sub of ['Profile', 'Tasted', 'Collection', 'Settings', 'Edit']) {
        if (await clickRole(page, 'button', sub)) {
          await settle(page, 800);
          await captureShot(page, slug, state);
        }
      }
    }

    if (await clickRole(page, 'button', 'SipStream', { exact: true })) {
      await settle(page, 1000);
      await captureShot(page, slug, state);
    }
    if (await clickRole(page, 'button', 'Local', { exact: true })) {
      await settle(page, 1000);
      await captureShot(page, slug, state);
    }
  } catch (e) {
    state.errors.push(String(e.message || e));
  } finally {
    await ctx.close();
  }
  return { slug, count: state.files.length, files: state.files, errors: state.errors };
}

async function captureStrainVerse(browser) {
  const slug = 'strainverse';
  await clearPrior(slug);
  const state = { index: 1, files: [], seen: new Set(), errors: [] };
  const ctx = await browser.newContext(VIEWPORT);
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);
  const email = 'strainverse.showcase3@example.com';
  const password = 'ShotDemo123!';

  try {
    await page.goto('https://strainverse-tmbc.vercel.app/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await settle(page, 1800);
    await dismissNoise(page);
    await captureShot(page, slug, state);

    const isLoggedIn = async () => {
      const body = await page.evaluate(() => document.body?.innerText || '');
      return /HerbHub|MatchIt|SocialSesh|My Stash|Explore Strains/i.test(body) && !/Sign in to continue|Create your account/i.test(body);
    };

    if (!(await isLoggedIn())) {
      // Prefer login
      await clickRole(page, 'button', 'Log In');
      await settle(page, 400);
      const hasEmail = await page.locator('input[type="email"]').isVisible({ timeout: 800 }).catch(() => false);
      if (hasEmail) {
        await page.locator('input[type="email"]').fill(email);
        await page.locator('input[type="password"]').fill(password);
        // Sign In if present else Create flow
        if (!(await clickRole(page, 'button', 'Sign In'))) {
          await clickRole(page, 'button', 'Log In');
        }
        await settle(page, 3000);
        await dismissNoise(page);
      }

      if (!(await isLoggedIn())) {
        await clickRole(page, 'button', 'Sign Up');
        await settle(page, 600);
        await captureShot(page, slug, state);
        await page.locator('input[placeholder="Alex Smith"]').fill('Showcase Demo').catch(() => {});
        await page.locator('input[placeholder="@alex"]').fill('@showcase3').catch(() => {});
        await page.locator('input[type="date"]').fill('1990-01-01').catch(() => {});
        await page.locator('input[type="email"]').fill(email).catch(() => {});
        await page.locator('input[type="password"]').fill(password).catch(() => {});
        await clickRole(page, 'button', 'Create Account');
        await settle(page, 4000);
        await dismissNoise(page);
      }

      // If signup said already registered, login
      if (!(await isLoggedIn())) {
        await clickRole(page, 'button', 'Log In');
        await settle(page, 500);
        await page.locator('input[type="email"]').fill(email).catch(() => {});
        await page.locator('input[type="password"]').fill(password).catch(() => {});
        await clickRole(page, 'button', 'Sign In');
        await settle(page, 3500);
        await dismissNoise(page);
      }
    }

    await captureShot(page, slug, state);

    // Main tabs
    for (const tab of ['StrainVerse', 'HerbHub', 'MatchIt', 'SocialSesh', 'My Stash']) {
      if (await clickRole(page, 'button', tab, { exact: true })) {
        await settle(page, 1100);
        await dismissNoise(page);
        await captureShot(page, slug, state);
      }
    }

    // Strain directory filters / views
    if (await clickRole(page, 'button', 'StrainVerse', { exact: true })) {
      await settle(page, 900);
      for (const f of ['Sativa', 'Indica', 'Hybrid', 'All', 'List view', 'Grid view']) {
        if (await clickRole(page, 'button', f)) {
          await settle(page, 700);
          await captureShot(page, slug, state);
        }
      }
      // Open a strain
      for (const name of ['Blue Dream', 'Sour Diesel', 'OG Kush', 'Granddaddy Purple']) {
        const card = page.getByText(name, { exact: true }).first();
        if (await card.isVisible({ timeout: 600 }).catch(() => false)) {
          await card.click().catch(() => {});
          await settle(page, 1200);
          await captureShot(page, slug, state);
          // back if needed
          if (await clickRole(page, 'button', 'Back')) await settle(page, 600);
          else if (await clickRole(page, 'button', 'StrainVerse', { exact: true })) await settle(page, 600);
          break;
        }
      }
    }

    // SocialSesh subs
    if (await clickRole(page, 'button', 'SocialSesh', { exact: true })) {
      await settle(page, 800);
      for (const sub of ['Create Sesh', 'My Seshes', 'Public']) {
        if (await clickRole(page, 'button', sub)) {
          await settle(page, 800);
          await captureShot(page, slug, state);
        }
      }
    }

    // My Stash subs
    if (await clickRole(page, 'button', 'My Stash', { exact: true })) {
      await settle(page, 800);
      for (const sub of ['Posts', 'Tried', 'Collections', 'Activity', 'Edit Profile']) {
        if (await clickRole(page, 'button', sub)) {
          await settle(page, 800);
          await captureShot(page, slug, state);
        }
      }
    }
  } catch (e) {
    state.errors.push(String(e.message || e));
  } finally {
    await ctx.close();
  }
  return { slug, count: state.files.length, files: state.files, errors: state.errors };
}

async function captureGuardr(browser) {
  const slug = 'guardr';
  await clearPrior(slug);
  const state = { index: 1, files: [], seen: new Set(), errors: [] };
  const ctx = await browser.newContext(VIEWPORT);
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);

  const ready = async () => {
    try {
      await page.waitForFunction(
        () => {
          const body = (document.body?.innerText || '').replace(/\s+/g, ' ').trim();
          return body.length > 80 && !/^beta v[\d.]+$/i.test(body) && /Log in|Sign up|Post coverage|Guardr/i.test(body);
        },
        { timeout: 25000 }
      );
    } catch {
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await page
        .waitForFunction(
          () => {
            const body = (document.body?.innerText || '').replace(/\s+/g, ' ').trim();
            return body.length > 80 && !/^beta v[\d.]+$/i.test(body);
          },
          { timeout: 20000 }
        )
        .catch(() => {});
    }
    await settle(page, 800);
    await dismissNoise(page);
    return true;
  };

  try {
    await page.goto('https://www.guardr.co/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await ready();
    await captureShot(page, slug, state);

    // Scroll sections on home (viewport fingerprint picks up new bands)
    for (let i = 0; i < 6; i++) {
      await page.evaluate(() => window.scrollBy(0, Math.floor(window.innerHeight * 0.75)));
      await settle(page, 800);
      await dismissNoise(page);
      await captureShot(page, slug, state);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await settle(page, 500);

    // Feature / explore cards on home
    for (const label of ['Post coverage', 'Schedule shifts', 'Browse jobs', 'Live operations', 'Teams & crews', 'Earnings']) {
      await page.goto('https://www.guardr.co/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await ready();
      if (await clickRole(page, 'button', label)) {
        await settle(page, 1500);
        await dismissNoise(page);
        await captureShot(page, slug, state);
      }
    }

    // Menu
    if (await clickRole(page, 'button', 'Open menu')) {
      await settle(page, 700);
      await captureShot(page, slug, state);
      for (const item of ['For clients', 'For guards', 'Safety', 'Company', 'Help']) {
        if (await clickRole(page, 'button', item)) {
          await settle(page, 700);
          await captureShot(page, slug, state);
        }
      }
      await clickRole(page, 'button', 'Close menu');
      await settle(page, 400);
    }

    // Auth / CTA buttons from home
    const actions = [
      { name: 'Log in', exact: true },
      { name: 'Sign up', exact: true },
      { name: 'Post a job' },
      { name: 'Find work as a guard' },
      { name: 'Create an account' },
      { name: 'Log in to your account' },
      { name: 'Browse jobs' },
    ];
    for (const a of actions) {
      await page.goto('https://www.guardr.co/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await ready();
      const clicked = (await clickRole(page, 'button', a.name, { exact: a.exact })) || (await clickRole(page, 'link', a.name, { exact: a.exact }));
      if (clicked) {
        await settle(page, 2000);
        await dismissNoise(page);
        await captureShot(page, slug, state);
        // Role selection / back paths
        for (const role of ['I need a guard', 'I am a guard', 'Client', 'Guard', 'Back to role selection']) {
          if (await clickRole(page, 'button', role)) {
            await settle(page, 1200);
            await captureShot(page, slug, state);
          }
        }
      }
    }

    // Query-param auth screens (wait for hydration)
    for (const q of ['?auth=sign-in', '?auth=sign-up', '?auth=sign-up&ar=client', '?auth=sign-up&ar=guard']) {
      await page.goto(`https://www.guardr.co/${q}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await ready();
      // If still beta-only, reload once
      const body = await page.evaluate(() => (document.body?.innerText || '').trim());
      if (/^beta/i.test(body)) {
        await page.reload({ waitUntil: 'domcontentloaded' });
        await ready();
      }
      await captureShot(page, slug, state);
    }

    // Common paths with long wait
    for (const p of ['/explore', '/login', '/signup', '/download']) {
      await page.goto(`https://www.guardr.co${p}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await ready();
      await captureShot(page, slug, state);
    }
  } catch (e) {
    state.errors.push(String(e.message || e));
  } finally {
    await ctx.close();
  }
  return { slug, count: state.files.length, files: state.files, errors: state.errors };
}

async function captureSSS(browser) {
  const slug = 'sss';
  await clearPrior(slug);
  const state = { index: 1, files: [], seen: new Set(), errors: [] };
  const ctx = await browser.newContext(VIEWPORT);
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);
  const base = 'https://signaturesecurityspecialist.com';

  try {
    await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await settle(page, 1500);
    await dismissNoise(page);
    await captureShot(page, slug, state);

    // Hero carousel
    for (let i = 0; i < 3; i++) {
      await clickRole(page, 'button', 'Tap to view next');
      await settle(page, 700);
      await captureShot(page, slug, state);
    }

    // Menu
    if (await clickRole(page, 'button', 'Open menu')) {
      await settle(page, 600);
      await captureShot(page, slug, state);
      await clickRole(page, 'button', 'Close menu');
    }

    // Feature carousels / expanders
    for (const label of [
      'Show Rank Levels',
      'Show Guard Types',
      'Show Operations',
      'Show Professional',
      'Next feature',
      'Next testimonial',
      'For Guards',
      'For Event Staff',
      'For Medical Staff',
      'For Clients',
      'Learn more',
    ]) {
      await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
      await settle(page, 1000);
      if (await clickRole(page, 'button', label)) {
        await settle(page, 800);
        await captureShot(page, slug, state);
      }
    }

    // Scroll home sections
    await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
    await settle(page, 1000);
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, Math.floor(window.innerHeight * 0.85)));
      await settle(page, 600);
      await captureShot(page, slug, state);
    }

    // Public routes
    const paths = [
      '/login',
      '/signup',
      '/explore',
      '/apply/client',
      '/apply/guard',
      '/apply/event-staff',
      '/apply/medical',
      '/careers',
      '/get-training',
      '/about',
      '/contact',
      '/services',
      '/pricing',
      '/book',
    ];
    for (const p of paths) {
      try {
        const resp = await page.goto(base + p, { waitUntil: 'domcontentloaded', timeout: 20000 });
        if (resp && resp.status() === 404) continue;
        await settle(page, 1000);
        await dismissNoise(page);
        await captureShot(page, slug, state);
      } catch (e) {
        state.errors.push(`${p}: ${e.message || e}`);
      }
    }
  } catch (e) {
    state.errors.push(String(e.message || e));
  } finally {
    await ctx.close();
  }
  return { slug, count: state.files.length, files: state.files, errors: state.errors };
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const only = new Set(process.argv.slice(2).filter((a) => !a.startsWith('-')));
  const browser = await chromium.launch({ headless: true });
  const apps = [];
  try {
    const run = (slug) => !only.size || only.has(slug);
    if (run('spiritsverse')) {
      console.log('\n=== spiritsverse ===');
      apps.push(await captureSpiritsVerse(browser));
    }
    if (run('guardr')) {
      console.log('\n=== guardr ===');
      apps.push(await captureGuardr(browser));
    }
    if (run('sss')) {
      console.log('\n=== sss ===');
      apps.push(await captureSSS(browser));
    }
    if (run('strainverse')) {
      console.log('\n=== strainverse ===');
      apps.push(await captureStrainVerse(browser));
    }
  } finally {
    await browser.close();
  }

  // Merge with existing summary when running a subset
  let prior = { apps: [], files: [] };
  try {
    prior = JSON.parse(await (await import('node:fs/promises')).readFile(path.join(outDir, 'multi-capture-summary.json'), 'utf8'));
  } catch {
    /* none */
  }
  const bySlug = new Map((prior.apps || []).map((a) => [a.slug, a]));
  for (const a of apps) bySlug.set(a.slug, { slug: a.slug, count: a.count, errors: a.errors, files: a.files });
  const mergedApps = ['spiritsverse', 'guardr', 'sss', 'strainverse'].map((s) => bySlug.get(s)).filter(Boolean);
  const payload = {
    generatedAt: new Date().toISOString(),
    apps: mergedApps,
    files: mergedApps.flatMap((a) => a.files || []),
  };
  await writeFile(path.join(outDir, 'multi-capture-summary.json'), JSON.stringify(payload, null, 2) + '\n');
  console.log('\n===== JSON SUMMARY =====');
  console.log(JSON.stringify(payload, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
