import type { ChromeAPI } from '../types/chrome';

export function getChromeAPI(): ChromeAPI | undefined {
  if (typeof window === 'undefined') return undefined;
  return (
    (window as any).chromeLite ||
    (window as any).chromeAPI ||
    (window as any).api ||
    (window as any).chrome
  );
}

export function isElectronApp(): boolean {
  if (typeof window === 'undefined') return false;
  const api = getChromeAPI();
  return Boolean(api && (api.tabs || api.window || (window as any).chromeLite));
}
