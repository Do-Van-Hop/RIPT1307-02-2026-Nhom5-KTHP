import axios from 'axios';
import { message } from 'antd';
import { useAuthStore } from '../store/authStore';

const tsrequest = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

tsrequest.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

tsrequest.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      message.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.');
      useAuthStore.getState().logout();
      window.location.href = '/login';
    } else if (status === 403) {
      message.error('Bạn không có quyền thực hiện hành động này.');
    } else if (status === 500) {
      message.error('Lỗi máy chủ, vui lòng thử lại sau.');
    }
    return Promise.reject(error);
  }
);

export default tsrequest;