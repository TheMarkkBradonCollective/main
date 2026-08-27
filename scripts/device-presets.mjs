/**
 * Viewport presets aligned with webmobilefirst.com device list.
 * @see https://www.webmobilefirst.com/en/
 */
export const DEVICE_PRESETS = {
  phone: {
    id: 'phone',
    label: 'Google Pixel 6',
    viewport: { width: 393, height: 851 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    frame: 'phone',
    suffix: 'phone',
  },
  tablet: {
    id: 'tablet',
    label: 'Samsung Galaxy Tab S7',
    viewport: { width: 800, height: 1280 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 11; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    frame: 'tablet',
    suffix: 'tablet',
  },
  desktop: {
    id: 'desktop',
    label: 'Macbook Air',
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    frame: 'desktop',
    suffix: 'desktop',
  },
};

export const DEVICE_ORDER = ['phone', 'tablet', 'desktop'];
