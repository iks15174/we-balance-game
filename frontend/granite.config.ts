import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'we-balance-game',
  brand: {
    displayName: '우리사이 밸런스 게임',
    primaryColor: '#FFC500', // 비비드 옐로우
    icon: '', // 콘솔에서 업로드한 아이콘 URL로 변경하세요
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
