import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { MailOutlined, LockOutlined, UserAddOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import tsrequest from '../services/tsrequest';
import { useAuthStore } from '../store/authStore';
import { AxiosError } from 'axios';

const { Text } = Typography;

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const onFinish = async (values: RegisterForm) => {
    setLoading(true);
    try {
      const response = await tsrequest.post('/auth/register', {
        email: values.email,
        password: values.password,
      });
      const { access_token, user } = response.data;
      login(user, access_token);
      message.success('Đăng ký thành công!');
      navigate('/candidate');
    } catch (error: unknown) {
      let msg = 'Đăng ký thất bại';
      if (error instanceof AxiosError) {
        msg = error.response?.data?.detail || error.response?.data?.message || msg;
      }
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#B30000]/5" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#0038F7]/5" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#B30000] shadow-lg mb-2">
            <UserAddOutlined className="text-white text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Đăng ký thí sinh</h2>
          <Text className="text-gray-400 text-sm mt-1 block m-2">
            Tạo tài khoản để bắt đầu nộp hồ sơ tuyển sinh
          </Text>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* Accent title */}
          <div className="flex items-center gap-2 mb-2 ">
            <div className="w-1 h-5 rounded-full bg-[#B30000]" />
            <span className="font-semibold text-gray-800 text-base">Tạo tài khoản mới</span>
          </div>

          <Form name="register" onFinish={onFinish} layout="vertical" requiredMark={false}>
            <Form.Item
              name="email"
              label={<span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Email</span>}
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ' },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-gray-300" />}
                placeholder="example@email.com"
                size="large"
                className="!rounded-xl !border-gray-200 hover:!border-[#B30000]/50 focus:!border-[#B30000]"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Mật khẩu</span>}
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-300" />}
                placeholder="••••••••"
                size="large"
                className="!rounded-xl !border-gray-200 hover:!border-[#B30000]/50 focus:!border-[#B30000]"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={<span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Xác nhận mật khẩu</span>}
              dependencies={['password']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<CheckCircleOutlined className="text-gray-300" />}
                placeholder="••••••••"
                size="large"
                className="!rounded-xl !border-gray-200 hover:!border-[#B30000]/50 focus:!border-[#B30000]"
              />
            </Form.Item>

            <Form.Item className="!mb-3 !mt-6">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                icon={<UserAddOutlined />}
                className="!rounded-xl !bg-[#B30000] !border-[#B30000] hover:!bg-[#E60000] hover:!border-[#E60000] !font-semibold !h-12 !text-base shadow-sm"
              >
                Đăng ký
              </Button>
            </Form.Item>
          </Form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <Text className="text-xs text-gray-300 font-medium">hoặc</Text>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Login link */}
          <div className="text-center">
            <Text className="text-gray-400 text-sm">Đã có tài khoản?</Text>{' '}
            <Link
              to="/login"
              className="!text-[#0038F7] !font-semibold text-sm hover:!text-blue-700 underline-offset-2"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-300 mt-6">
          Hệ thống quản lý tuyển sinh trực tuyến
        </p>
      </div>
    </div>
  );
};

export default Register;