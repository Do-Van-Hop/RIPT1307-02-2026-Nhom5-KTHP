import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import tsrequest from '../services/tsrequest';
import { useAuthStore } from '../store/authStore';

const { Title } = Typography;

interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      const response = await tsrequest.post('/auth/login', {
        email: values.email,
        password: values.password,
      });
      const { user, token } = response.data;
      login(user, token);
      message.success('Đăng nhập thành công!');
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/candidate');
      }
    } catch (error: unknown) {
      let msg = 'Đăng nhập thất bại';
      if (error instanceof AxiosError) {
        msg = error.response?.data?.message || msg;
      }
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 24 }}>
      <Title level={2} style={{ textAlign: 'center' }}>Đăng Nhập</Title>
      <Form name="login" onFinish={onFinish} layout="vertical">
        <Form.Item
          name="email"
          rules={[{ required: true, message: 'Vui lòng nhập email!' }]}
        >
          <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block size="large">
            Đăng Nhập
          </Button>
        </Form.Item>
        <div style={{ textAlign: 'center' }}>
          Chưa có tài khoản? <Link to="/register">Đăng ký thí sinh</Link>
        </div>
      </Form>
    </div>
  );
};

export default Login;