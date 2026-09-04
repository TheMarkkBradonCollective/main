#!/usr/bin/env node
/**
 * Capture mobile screenshots of live MBC apps for The Classifieds.
 * Tries light navigation / signup where safe to show real product UI.
 * Usage: node scripts/capture-app-screenshots.mjs
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'images', 'screenshots');


const apps = [
  {
    slug: 'buynothing',
    url: 'https://www.sacramentobuynothing.com',
    prep: async (page) => {
      // Prefer a live listing if one is visible from home/browse
      await clickFirst(page, [
        'a:has-text("Browse")',
        'a:has-text("Explore")',
        'button:has-text("Browse")',
        'text=Coffee table',
        '[href*="listing"]',
      ]);
      await settle(page, 1200);
    },
  },
  {
    slug: 'strainverse',
    url: 'https://strainverse-tmbc.vercel.app',
    prep: async (page) => {
      await clickFirst(page, ['button:has-text("X")', '[aria-label="Close"]', 'button:has-text("Close")']);
      await clickFirst(page, [
        'text=Explore Strains',
        'a:has-text("Explore")',
        'button:has-text("Explore")',
      ]);
      await settle(page, 1800);
    },
  },
  {
    slug: 'spiritsverse',
    url: 'https://spiritsverse-tmbc.vercel.app',
    prep: async (page) => {
      await clickFirst(page, [
        'text=Drink Encyclopedia',
        'a:has-text("Encyclopedia")',
        'button:has-text("Explore")',
      ]);
      await settle(page, 1800);
    },
  },
  {
    slug: 'cookverse',
    url: 'https://cookverse-tmbc.vercel.app',
    prep: async (page) => {
      await clickFirst(page, [
        'text=Get Started',
        'button:has-text("Get Started")',
        'a:has-text("Get Started")',
      ]);
      await settle(page, 1500);
      // If age gate / continue appears
      await clickFirst(page, [
        'button:has-text("Continue")',
        'button:has-text("I\'m in")',
        'button:has-text("Enter")',
        'text=Browse',
        'text=Recipes',
      ]);
      await settle(page, 1500);
    },
  },
  {
    slug: 'gigos',
    url: 'https://gigos.vercel.app',
    prep: async (page) => {
      await settle(page, 800);
    },
  },
  {
    slug: 'friendr',
    url: 'https://friendr-tmbc.vercel.app',
    prep: async (page) => {
      // Landing hero is strong branding — keep unless we can reach a public explore view
      await clickFirst(page, ['a:has-text("How it works")', 'text=How it works', 'text=Learn more']);
      await settle(page, 1000);
    },
  },
  {
    slug: 'findr',
    url: 'https://findr-tmbc.vercel.app',
    prep: async (page) => {
      // Landing hero is the cleanest public marketing frame
      await settle(page, 400);
    },
  },
  {
    slug: 'chatr',
    url: 'https://chatr-tmbc.vercel.app',
    prep: async (page) => {
      // Simple board signup — name only
      await fillFirst(page, [
        'input[placeholder*="Alex" i]',
        'input[name="name"]',
        'input[type="text"]',
      ], 'MBC Demo');
      await clickFirst(page, [
        'button:has-text("Pin me")',
        'button:has-text("Pin")',
        'button[type="submit"]',
      ]);
      await settle(page, 2200);
    },
  },
  {
    slug: 'guardr',
    url: 'https://www.guardr.co',
    prep: async (page) => {
      // Scroll a bit so Explore cards show, or keep hero
      await page.evaluate(() => window.scrollBy(0, 120)).catch(() => {});
      await settle(page, 600);
    },
  },
  {
    slug: 'sss',
    url: 'https://signaturesecurityspecialist.com',
    prep: async (page) => {
      // Advance carousel once for variety
      await clickFirst(page, [
        'text=Tap to view next',
        'button:has-text("next")',
        '[aria-label="Next"]',
      ]);
      await settle(page, 800);
    },
  },
];

async function settle(page, ms = 1000) {
  await page.waitForTimeout(ms);
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
}

async function clickFirst(page, selectors) {
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 700 })) {
        await el.click({ timeout: 1500 });
        return true;
      }
    } catch {
      /* try next */
    }
  }
  return false;
}

async function fillFirst(page, selectors, value) {
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 700 })) {
        await el.fill(value, { timeout: 1500 });
        return true;
      }
    } catch {
      /* try next */
    }
  }
  return false;
}

async function dismissNoise(page) {
  await clickFirst(page, [
    'button:has-text("Accept")',
    'button:has-text("Got it")',
    'button:has-text("I agree")',
    'button:has-text("Allow all")',
    'button:has-text("Not now")',
    'button:has-text("Maybe later")',
    'button:has-text("Skip")',
    '[aria-label="Close"]',
    '[aria-label="Dismiss"]',
  ]);
  // Hide install overlays without destroying the page tree
  await page.evaluate(() => {
    const hide = (el) => {
      if (!el) return;
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
    };
    for (const el of document.querySelectorAll('[role="dialog"], [class*="install"], [class*="Install"], [class*="pwa"], [class*="prompt"]')) {
      if (/install/i.test(el.textContent || '')) hide(el);
    }
    for (const el of document.querySelectorAll('body *')) {
      const style = getComputedStyle(el);
      if (
        (style.position === 'fixed' || style.position === 'sticky') &&
        /Install\s/i.test(el.textContent || '') &&
        el.children.length < 25
      ) {
        hide(el);
      }
    }
  }).catch(() => {});
}

async function captureOne(browser, app) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);

  const result = { slug: app.slug, url: app.url, ok: false, error: null, file: null };

  try {
    const response = await page.goto(app.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    if (!response || !response.ok()) {
      console.warn(`[${app.slug}] HTTP ${response?.status() ?? 'none'} — continuing`);
    }
    await settle(page, 2000);
    await dismissNoise(page);
    if (typeof app.prep === 'function') {
      try {
        await app.prep(page);
      } catch (prepErr) {
        console.warn(`[${app.slug}] prep skipped: ${prepErr.message || prepErr}`);
      }
    }
    await settle(page, 900);

    const file = path.join(outDir, `${app.slug}.jpg`);
    await page.screenshot({
      path: file,
      type: 'jpeg',
      quality: 84,
      fullPage: false,
    });
    result.ok = true;
    result.file = path.relative(root, file);
    console.log(`✓ ${app.slug} → ${result.file}`);
  } catch (err) {
    result.error = String(err?.message || err);
    console.error(`✗ ${app.slug}: ${result.error}`);
  } finally {
    await context.close();
  }
  return result;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const app of apps) {
      results.push(await captureOne(browser, app));
    }
  } finally {
    await browser.close();
  }
  await writeFile(
    path.join(outDir, 'manifest.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        note: 'Demo accounts use disposable emails and are not committed as credentials.',
        results,
      },
      null,
      2
    ) + '\n'
  );
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.error(`\nFailed: ${failed.map((f) => f.slug).join(', ')}`);
    process.exitCode = 1;
  } else {
    console.log(`\nAll ${results.length} screenshots captured.`);
  }
}

main();
