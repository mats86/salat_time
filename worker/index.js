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
    self.clients.claim().then(() => restoreSchedule())
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
