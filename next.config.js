const defaultCache = require('next-pwa/cache');

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  additionalManifestEntries: [
    { url: '/sounds/adhan.mp3', revision: null },
    { url: '/icons/icon-192.png', revision: null },
  ],
  runtimeCaching: [
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
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'directus.alattas.de' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
    ],
  },
};

module.exports = withPWA(nextConfig);
