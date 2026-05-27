import React from 'react';
import { Card, Descriptions } from 'antd';
import { useAuthStore } from '../../store/authStore';

const Profile: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <Card title="Thông tin cá nhân" style={{ maxWidth: 600, margin: '0 auto' }}>
      <Descriptions column={1} bordered>
        <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
        <Descriptions.Item label="Vai trò">Thí sinh</Descriptions.Item>
      </Descriptions>
      <div style={{ marginTop: 24, color: 'gray', textAlign: 'center' }}>
        Tính năng đổi mật khẩu đang được phát triển.
      </div>
    </Card>
  );
};

export default Profile;