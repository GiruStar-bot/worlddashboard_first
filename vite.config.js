import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the Worlddashboard project.
export default defineConfig({
  plugins: [react()],
  // GitHub Pages のリポジトリ名変更時でも壊れないよう、相対パスで配信する
  base: "./",
  server: {
    port: 5173,
  },
});
