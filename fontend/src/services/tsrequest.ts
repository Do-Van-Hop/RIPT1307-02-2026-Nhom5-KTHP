import axios from 'axios';
import { message } from 'antd';
import { useAuthStore } from '../store/authStore';

const baseURL = import.meta.env.VITE_API_URL || '/api';

const tsrequest = axios.create({
  baseURL,
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
    const detail = error.response?.data?.detail;

    if (status === 401) {
      message.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.');
      useAuthStore.getState().logout();
      window.location.href = '/login';
    } else if (status === 403) {
      message.error(detail || 'Bạn không có quyền thực hiện hành động này.');
    } else if (status === 400) {
      message.error(detail || 'Dữ liệu gửi lên không hợp lệ.');
    } else if (status === 404) {
      message.error(detail || 'Không tìm thấy tài nguyên.');
    } else if (status === 500) {
      message.error('Lỗi máy chủ, vui lòng thử lại sau.');
    } else {
      message.error(detail || 'Có lỗi xảy ra, vui lòng thử lại.');
    }

    return Promise.reject(error);
  }
);

export default tsrequest;