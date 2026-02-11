import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the Worlddashboard project.
// We enable the React plugin and set the base URL to match the GitHub Pages repository name.
export default defineConfig({
  plugins: [react()],
  // ★重要: これがないとGitHub Pagesでファイルが見つかりません
  base: "/worlddashboard_2/",
  server: {
    port: 5173,
  },
});
