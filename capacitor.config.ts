import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meridiananalytica.westminstersim',
  appName: 'WestminsterSim',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      backgroundColor: '#FAF7F1',
      launchAutoHide: true,
      showSpinner: false,
    },
  },
};

export default config;
