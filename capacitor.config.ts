import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.salatzeit.app',
  appName: 'Salat Zeit',
  webDir: 'public',
  server: {
    url: 'https://salat-time.alattas.de',
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    backgroundColor: '#0f2318',
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#0f2318',
      launchShowDuration: 2000,
      androidSplashResourceName: 'splash',
    },
    StatusBar: {
      backgroundColor: '#1a3a2a',
      style: 'DARK',
    },
  },
};

export default config;
