import React from 'react';
import { Layout, Menu, Button } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Header, Content } = Layout;

const CandidateLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Menu theme="dark" mode="horizontal" onClick={handleMenuClick} style={{ flex: 1 }}>
          <Menu.Item key="/candidate/applications">Hồ sơ của tôi</Menu.Item>
          <Menu.Item key="/candidate/results">Kết quả</Menu.Item>
          <Menu.Item key="/candidate/profile">Thông tin cá nhân</Menu.Item>
        </Menu>
        <div style={{ color: '#fff', marginRight: 16 }}>{user?.email}</div>
        <Button onClick={() => { logout(); navigate('/login'); }}>Đăng xuất</Button>
      </Header>
      <Content style={{ padding: 24 }}>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default CandidateLayout;