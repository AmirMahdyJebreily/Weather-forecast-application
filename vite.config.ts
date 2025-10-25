import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import svgLoader from 'vite-svg-loader'

const isCi = Boolean(process.env.GITHUB_ACTIONS)
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = process.env.VITE_BASE ?? (isCi && repoName ? `/${repoName}/` : './')

export default defineConfig({
  base,
  plugins: [
    vue(),
    vueDevTools(),
    svgLoader()
  ],
  server: {
    allowedHosts: ["amirmahdyjebreily.github.io"],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
