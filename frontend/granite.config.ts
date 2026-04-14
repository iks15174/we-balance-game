import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'we-balance-game',
  brand: {
    displayName: '우리사이 밸런스게임',
    primaryColor: '#3182F6',
    icon: 'https://static.toss.im/appsintoss/5523/ed436e70-2649-4bba-9498-9a3b28f3afac.png',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
  webViewProps: {
    type: 'partner',
  },
});
