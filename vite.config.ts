import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import playerHandler from './api/player.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (env.COC_API_TOKEN && !process.env.COC_API_TOKEN) {
    process.env.COC_API_TOKEN = env.COC_API_TOKEN
  }
  if (env.COC_PROXY_URL && !process.env.COC_PROXY_URL) {
    process.env.COC_PROXY_URL = env.COC_PROXY_URL
  }

  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'coc-api-dev-server',
        configureServer(server) {
          server.middlewares.use('/api/player', (req, res) => {
            playerHandler(req as any, res as any)
          })
        },
      },
    ],
  }
})
