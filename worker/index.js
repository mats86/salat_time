/* eslint-disable no-restricted-globals */

const prayerTimeouts = [];
const firedToday = new Set();

const DB_NAME = 'sz-offline';
const DB_VERSION = 1;
const STORE = 'schedule';
const SCHEDULE_ID = 'prayer-schedule';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getMsUntil(time) {
  const [h, m] = time.split(':').map(Number);
  const target = new Date();
  target.setHours(h, m, 0, 0);
  let diff = target.getTime() - Date.now();
  if (diff < 0) diff += 24 * 60 * 60 * 1000;
  return diff;
}

function clearSchedules() {
  prayerTimeouts.forEach(clearTimeout);
  prayerTimeouts.length = 0;
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveSchedule(payload) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(payload, SCHEDULE_ID);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadSchedule() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(SCHEDULE_ID);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function hasVisibleClient() {
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
  return clients.some((client) => client.visibilityState === 'visible');
}

async function showPrayerNotification(prayer, labels) {
  const label = labels[prayer.name] || {
    title: prayer.name,
    body: 'Prayer time',
  };

  await self.registration.showNotification(label.title, {
    body: label.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: `prayer-${prayer.name}-${todayKey()}`,
    silent: false,
    vibrate: [200, 100, 200],
    data: { prayer: prayer.name },
  });
}

function schedulePrayers(payload) {
  clearSchedules();
  firedToday.clear();

  if (!payload || !Array.isArray(payload.prayers)) return;

  const { prayers, labels } = payload;
  const maxDelay = 24 * 60 * 60 * 1000;

  for (const prayer of prayers) {
    if (!prayer.enabled) continue;

    const delay = getMsUntil(prayer.time);
    if (delay <= 0 || delay > maxDelay) continue;

    const timeoutId = setTimeout(async () => {
      if (firedToday.has(prayer.name)) return;

      const visible = await hasVisibleClient();
      if (visible) return;

      firedToday.add(prayer.name);
      await showPrayerNotification(prayer, labels);
    }, delay);

    prayerTimeouts.push(timeoutId);
  }
}

async function restoreSchedule() {
  const payload = await loadSchedule();
  if (payload) schedulePrayers(payload);
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((name) => name === 'start-url' || name === 'pages')
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
      await restoreSchedule();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_PRAYERS') {
    const payload = event.data.payload;
    schedulePrayers(payload);
    saveSchedule(payload).catch(() => {});
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
      return undefined;
    })
  );
});

const NAV_DENY = /^\/(api|auth|admin|staff|mosque)\//;
const CACHE_PRIORITY = ['start-url', 'pages', 'others'];
const OFFLINE_URL = '/offline.html';
const NETWORK_TIMEOUT_MS = 2000;

function isDocumentRequest(request) {
  return request.mode === 'navigate' || request.destination === 'document';
}

async function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function matchInCache(cacheName, request) {
  const cache = await caches.open(cacheName);
  return cache.match(request, { ignoreSearch: true });
}

async function findCachedNavigation(request) {
  for (const name of CACHE_PRIORITY) {
    const match = await matchInCache(name, request);
    if (match) return match;
  }

  const keys = await caches.keys();
  for (const name of keys) {
    if (CACHE_PRIORITY.includes(name)) continue;
    const cache = await caches.open(name);
    const match = await cache.match(request, { ignoreSearch: true });
    if (match) return match;
  }

  return null;
}

async function serveOfflinePage() {
  const cached = await caches.match(OFFLINE_URL, { ignoreSearch: true });
  if (cached) return cached;

  const keys = await caches.keys();
  for (const name of keys) {
    const cache = await caches.open(name);
    const match = await cache.match(OFFLINE_URL, { ignoreSearch: true });
    if (match) return match;
  }

  return new Response(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Salat Zeit</title></head><body><p>Offline</p></body></html>',
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

async function handleNavigation(request) {
  try {
    const response = await fetchWithTimeout(request, NETWORK_TIMEOUT_MS);
    if (response.ok || response.type === 'opaqueredirect') {
      if (response.redirected) {
        return new Response(response.body, {
          status: 200,
          statusText: 'OK',
          headers: response.headers,
        });
      }
      return response;
    }
  } catch {
    /* fall through to cache */
  }

  const cached = await findCachedNavigation(request);
  if (cached) return cached;

  return serveOfflinePage();
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!isDocumentRequest(event.request)) return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (NAV_DENY.test(url.pathname)) return;

  event.respondWith(handleNavigation(event.request));
});
