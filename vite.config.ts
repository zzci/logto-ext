import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import devServer, { defaultOptions } from '@hono/vite-dev-server'

export default defineConfig({
  root: resolve(__dirname, 'web/user'),
  base: '/user/',
  plugins: [
    react(),
    tailwindcss(),
    devServer({
      entry: resolve(__dirname, 'src/app.ts'),
      exclude: [
        ...defaultOptions.exclude,
        // Exclude /user/* so Vite handles SPA, but NOT /user/config.json (goes to Hono)
        /^\/user(?!\/config\.json)/,
      ],
      injectClientScript: false,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'web/user/src'),
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist/user'),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
  },
})
