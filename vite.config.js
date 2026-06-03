import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/v1': {
        target: 'http://112.30.139.26:11449',
        changeOrigin: true
      }
    }
  }
})
