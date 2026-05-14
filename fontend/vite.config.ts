// fontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8006', // Đổi sang cổng chạy FastAPI của bạn
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Cắt chữ /api khi gọi sang BE
      },
    },
  },
});