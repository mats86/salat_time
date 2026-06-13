const START_URL_CACHE = 'start-url';
const PAGES_CACHE = 'pages';

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

export async function warmupNavigationCache(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!navigator.onLine) return;
  if (!('serviceWorker' in navigator) || !('caches' in window)) return;

  try {
    await navigator.serviceWorker.ready;

    const rootUrl = new URL('/', window.location.origin).href;
    const rootRequest = new Request(rootUrl, { credentials: 'same-origin' });
    const rootResponse = await fetch(rootRequest);
    await storeInCache(START_URL_CACHE, rootRequest, rootResponse);

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
