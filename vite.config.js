import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBase = env.VITE_API_BASE_URL || 'http://192.168.192.81:4500'
  const apiOrigin = apiBase.replace(/\/api$/, '')

  const zakanetApiBase = env.VITE_ZAKANET_API_BASE_URL || ''
  const zakanetApiOrigin = zakanetApiBase.replace(/\/api$/, '')

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiOrigin,
          changeOrigin: true,
        },
        ...(zakanetApiOrigin && {
          '/zakanet-api': {
            target: zakanetApiOrigin,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/zakanet-api/, '/api'),
          },
        }),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('/node_modules/vue') ||
                id.includes('/node_modules/vue-router') ||
                id.includes('/node_modules/pinia')) {
              return 'vue-vendor'
            }
            if (id.includes('/node_modules/chart.js') ||
                id.includes('/node_modules/vue-chartjs')) {
              return 'chart-vendor'
            }
            if (id.includes('/node_modules/axios')) {
              return 'axios'
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  }
})
