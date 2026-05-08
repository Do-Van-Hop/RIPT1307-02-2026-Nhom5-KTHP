import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Descriptions, Space } from 'antd';
import { useAuthStore } from '../../store/authStore';
import tsrequest from '../../services/tsrequest';

const Profile: React.FC = () => {
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleChangePassword = async (values: { oldPassword: string; newPassword: string }) => {
    setLoading(true);
    try {
      await tsrequest.put('/auth/change-password', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      message.success('Đổi mật khẩu thành công');
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Thông tin cá nhân" style={{ maxWidth: 600, margin: '0 auto' }}>
      <Descriptions column={1} bordered>
        <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
        <Descriptions.Item label="Vai trò">Thí sinh</Descriptions.Item>
      </Descriptions>

      <Card title="Đổi mật khẩu" style={{ marginTop: 24 }}>
        <Form form={form} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item
            name="oldPassword"
            label="Mật khẩu cũ"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Cập nhật mật khẩu
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Card>
  );
};

export default Profile;