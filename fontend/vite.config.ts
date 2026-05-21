import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables từ .env tương ứng với mode (development, production)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          // Đọc target từ biến môi trường, fallback về mặc định
          target: env.VITE_API_BASE_URL || 'http://127.0.0.1:8006',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    define: {
      // Có thể expose thêm biến cho frontend code nếu cần
      'import.meta.env.VITE_API_URL': JSON.stringify('/api'), // giá trị mặc định, vẫn dùng proxy
    },
  };
});