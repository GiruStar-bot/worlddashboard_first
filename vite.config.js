import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pagesのリポジトリ名に合わせてベースパスを設定
  base: "/worlddashboard_2/",
  server: {
    port: 5173,
  },
});
