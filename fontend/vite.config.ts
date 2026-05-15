import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8006', // Cổng FastAPI backend
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Xoá prefix /api khi gọi sang BE
      },
    },
  },
  define: {
    // Optional: định nghĩa biến môi trường cho frontend
    'import.meta.env.VITE_API_URL': JSON.stringify('/api'),
  },
});