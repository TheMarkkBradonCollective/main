/** App version shown on loading splash and update tooling. */
export const APP_VERSION = '1.4.7';
export const APP_NAME = 'The Markk Brandon Collective';
export const APP_SHORT = 'MBC';

export function formatAppVersion(prefix = 'v') {
  return `${prefix}${APP_VERSION}`;
}
