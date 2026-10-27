#!/usr/bin/env node
/**
 * Capture device-matched screenshots (webmobilefirst.com presets) and composite
 * them into desktop-browser frames with the correct inner device.
 *
 * Phone  → Google Pixel 6 (393×851) inside browser + Android shell
 * Tablet → Galaxy Tab S7 (800×1280 portrait) inside browser + tablet shell
 * Desktop → Macbook Air (1280×800) full browser content
 *
 * Usage:
 *   node scripts/capture-device-screenshots.mjs
 *   node scripts/capture-device-screenshots.mjs guardr strainverse
 */
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEVICE_PRESETS, DEVICE_ORDER } from './device-presets.mjs';
import { framedCaptureHtml } from './framed-capture.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'images', 'screenshots');

const APPS = [
  { slug: 'buynothing', url: 'https://www.sacramentobuynothing.com' },
  { slug: 'strainverse', url: 'https://strainverse-tmbc.vercel.app' },
  { slug: 'spiritsverse', url: 'https://spiritsverse-tmbc.vercel.app' },
  { slug: 'cookverse', url: 'https://cookverse-tmbc.vercel.app' },
  { slug: 'gigos', url: 'https://gigos.vercel.app' },
  { slug: 'friendr', url: 'https://friendr-tmbc.vercel.app' },
  { slug: 'findr', url: 'https://findr-tmbc.vercel.app' },
  { slug: 'chatr', url: 'https://chatr-tmbc.vercel.app' },
  { slug: 'guardr', url: 'https://www.guardr.co' },
  { slug: 'sss', url: 'https://signaturesecurityspecialist.com' },
];

async function settle(page, ms = 1200) {
  await page.waitForTimeout(ms);
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
}

async function dismissNoise(page) {
  for (const name of ['Dismiss install prompt', 'Not now', 'Maybe later', 'Later', 'Skip', 'No thanks', 'Accept', 'Got it']) {
    try {
      const el = page.getByRole('button', { name, exact: false }).first();
      if (await el.isVisible({ timeout: 300 })) await el.click({ timeout: 1000 });
    } catch {
      /* next */
    }
  }
  await page
    .evaluate(() => {
      const hide = (el) => {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
      };
      for (const el of document.querySelectorAll('[role="dialog"], [class*="install" i], [class*="pwa" i]')) {
        const txt = (el.textContent || '').slice(0, 400);
        if (/install|add to home/i.test(txt)) hide(el);
      }
    })
    .catch(() => {});
}

async function frameScreenshot(framePage, deviceType, rawJpeg, pageUrl, deviceLabel) {
  const b64 = rawJpeg.toString('base64');
  await framePage.setContent(
    framedCaptureHtml({ deviceType, screenshotBase64: b64, pageUrl, deviceLabel }),
    { waitUntil: 'networkidle' }
  );
  await framePage.waitForTimeout(200);
  return framePage.locator('#export').screenshot({ type: 'jpeg', quality: 88 });
}

async function captureApp(browser, framePage, app) {
  const results = { slug: app.slug, devices: {} };

  for (const deviceKey of DEVICE_ORDER) {
    const preset = DEVICE_PRESETS[deviceKey];
    const ctx = await browser.newContext({
      viewport: preset.viewport,
      deviceScaleFactor: preset.deviceScaleFactor,
      isMobile: preset.isMobile,
      hasTouch: preset.hasTouch,
      userAgent: preset.userAgent,
    });
    const page = await ctx.newPage();
    page.setDefaultTimeout(45000);

    try {
      await page.goto(app.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await settle(page, 2000);
      await dismissNoise(page);
      if (deviceKey === 'desktop') {
        await page.setViewportSize(preset.viewport);
      }
      await settle(page, 800);

      const raw = await page.screenshot({ type: 'jpeg', quality: 90, fullPage: false });
      const framed = await frameScreenshot(framePage, preset.frame, raw, app.url, preset.label);

      const fileName = `${app.slug}-${preset.suffix}-hero.jpg`;
      const filePath = path.join(outDir, fileName);
      await writeFile(filePath, framed);

      results.devices[deviceKey] = {
        file: path.relative(root, filePath),
        device: deviceKey,
        framed: true,
        label: preset.label,
      };
      console.log(`✓ ${app.slug} [${deviceKey}] → ${fileName}`);
    } catch (err) {
      results.devices[deviceKey] = { error: String(err?.message || err) };
      console.error(`✗ ${app.slug} [${deviceKey}]: ${err.message || err}`);
    } finally {
      await ctx.close();
    }
  }

  return results;
}

async function syncProjectsJson(captureResults) {
  const projectsPath = path.join(root, 'My-Projects.json');
  const projects = JSON.parse(await readFile(projectsPath, 'utf8'));

  for (const result of captureResults) {
    const project = projects.find((p) => p.slug === result.slug);
    if (!project) continue;

    const phone = result.devices.phone?.file;
    const tablet = result.devices.tablet?.file;
    const desktop = result.devices.desktop?.file;

    if (phone) {
      const entry = {
        src: phone,
        caption: `${project.name} on ${DEVICE_PRESETS.phone.label}`,
        device: 'phone',
        framed: true,
      };
      if (!project.screenshots?.length) project.screenshots = [entry];
      else project.screenshots[0] = { ...project.screenshots[0], ...entry };
    }

    if (tablet) {
      const entry = {
        src: tablet,
        caption: `${project.name} on ${DEVICE_PRESETS.tablet.label}`,
        device: 'tablet',
        framed: true,
      };
      project.screenshotsTablet = [entry, ...(project.screenshotsTablet || []).slice(1)];
    }

    if (desktop) {
      const entry = {
        src: desktop,
        caption: `${project.name} on ${DEVICE_PRESETS.desktop.label}`,
        device: 'desktop',
        framed: true,
      };
      project.screenshotsDesktop = [entry, ...(project.screenshotsDesktop || []).slice(1)];
    }
  }

  await writeFile(projectsPath, JSON.stringify(projects, null, 2) + '\n');
  console.log('\nUpdated My-Projects.json hero shots per device.');
}

async function main() {
  const filter = process.argv.slice(2).map((s) => s.toLowerCase());
  const apps = filter.length ? APPS.filter((a) => filter.includes(a.slug)) : APPS;
  if (!apps.length) {
    console.error('No matching apps. Slugs:', APPS.map((a) => a.slug).join(', '));
    process.exit(1);
  }

  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const frameCtx = await browser.newContext({ viewport: { width: 960, height: 640 } });
  const framePage = await frameCtx.newPage();

  const captureResults = [];
  try {
    for (const app of apps) {
      captureResults.push(await captureApp(browser, framePage, app));
    }
  } finally {
    await frameCtx.close();
    await browser.close();
  }

  const summaryPath = path.join(outDir, 'device-capture-summary.json');
  await writeFile(
    summaryPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), source: 'webmobilefirst-aligned presets', results: captureResults }, null, 2) + '\n'
  );

  await syncProjectsJson(captureResults);
  const failed = captureResults.flatMap((r) =>
    DEVICE_ORDER.filter((d) => r.devices[d]?.error).map((d) => `${r.slug}:${d}`)
  );
  if (failed.length) {
    console.error('\nPartial failures:', failed.join(', '));
    process.exitCode = 1;
  } else {
    console.log(`\nCaptured ${apps.length} apps × 3 devices.`);
  }
}

main();
