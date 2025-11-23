import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // Use a repo-root base when building for GitHub Pages so asset
      // URLs resolve to `https://<user>.github.io/<repo>/...`.
      // Default to '/cb-new/' for the new repository deployment but allow
      // overriding via the REPO_BASE environment variable when needed.
      base: mode === 'production' ? (process.env.REPO_BASE || '/cb-new/') : '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
