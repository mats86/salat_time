const defaultCache = require('next-pwa/cache');

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  dynamicStartUrl: false,
  navigationPreload: false,
  fallbacks: {
    document: '/offline.html',
  },
  navigateFallback: '/offline.html',
  navigateFallbackDenylist: [/^\/api\//, /^\/auth\//, /^\/admin\//, /^\/staff\//, /^\/mosque\//],
  buildExcludes: [/app-build-manifest\.json$/],
  additionalManifestEntries: [
    { url: '/offline.html', revision: null },
    { url: '/qibla', revision: null },
    { url: '/fonts/material-symbols-outlined.ttf', revision: null },
    { url: '/sounds/adhan.mp3', revision: null },
    { url: '/icons/icon-192.png', revision: null },
    { url: '/icons/icon-512.png', revision: null },
    { url: '/manifest.json', revision: null },
  ],
  runtimeCaching: [
    {
      urlPattern: ({ request }) =>
        request.mode === 'navigate' || request.destination === 'document',
      handler: 'CacheFirst',
      options: {
        cacheName: 'pages',
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 24 * 60 * 60,
        },
        matchOptions: { ignoreSearch: true },
      },
    },
    {
      urlPattern: /^https:\/\/api\.aladhan\.com\/v1\/timings\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'aladhan-prayer-times',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
      },
    },
    ...defaultCache,
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => [
    {
      source: '/',
      headers: [
        {
          key: 'Cache-Control',
          value: 'private, no-cache, no-store, must-revalidate',
        },
      ],
    },
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'directus.alattas.de' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
    ],
  },
};

module.exports = withPWA(nextConfig);
