const START_URL_CACHE = 'start-url';
const PAGES_CACHE = 'pages';
const OFFLINE_URL = '/offline.html';
const MATERIAL_SYMBOLS_FONT = '/fonts/material-symbols-outlined.ttf';

async function storeInCache(
  cacheName: string,
  request: Request,
  response: Response
): Promise<void> {
  if (!response.ok && response.type !== 'opaqueredirect') return;

  const cache = await caches.open(cacheName);
  const toStore = response.redirected
    ? new Response(response.body, {
        status: 200,
        statusText: 'OK',
        headers: response.headers,
      })
    : response;

  await cache.put(request, toStore);
}

async function ensureServiceWorkerReady(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return;

  await registration.update().catch(() => {});
  await navigator.serviceWorker.ready;
}

export async function warmupNavigationCache(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!navigator.onLine) return;
  if (!('serviceWorker' in navigator) || !('caches' in window)) return;

  try {
    await ensureServiceWorkerReady();

    const rootUrl = new URL('/', window.location.origin).href;
    const rootRequest = new Request(rootUrl, { credentials: 'same-origin' });
    const rootResponse = await fetch(rootRequest);
    await storeInCache(START_URL_CACHE, rootRequest, rootResponse);
    await storeInCache(PAGES_CACHE, rootRequest, rootResponse);

    const offlineRequest = new Request(
      new URL(OFFLINE_URL, window.location.origin).href,
      { credentials: 'same-origin' }
    );
    const offlineResponse = await fetch(offlineRequest);
    await storeInCache(PAGES_CACHE, offlineRequest, offlineResponse);

    const fontRequest = new Request(
      new URL(MATERIAL_SYMBOLS_FONT, window.location.origin).href,
      { credentials: 'same-origin' }
    );
    const fontResponse = await fetch(fontRequest);
    await storeInCache('static-font-assets', fontRequest, fontResponse);

    const currentPath = window.location.pathname;
    if (currentPath && currentPath !== '/') {
      const pageUrl = new URL(currentPath, window.location.origin).href;
      const pageRequest = new Request(pageUrl, { credentials: 'same-origin' });
      const pageResponse = await fetch(pageRequest);
      await storeInCache(PAGES_CACHE, pageRequest, pageResponse);
    }
  } catch {
    /* cache warmup is best-effort */
  }
}
