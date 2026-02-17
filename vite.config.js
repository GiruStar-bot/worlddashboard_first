import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the Worlddashboard project.
export default defineConfig({
  plugins: [react()],
  // 修正: GitHub Pagesのリポジトリ名に合わせてベースパスを設定
  base: "/worlddashboard_first/",
  server: {
    port: 5173,
  },
});
