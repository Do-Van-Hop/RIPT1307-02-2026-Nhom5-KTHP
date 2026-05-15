import React from 'react';
import { Layout, Menu, Button, theme } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Header, Content } = Layout;

const CandidateLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    { key: '/candidate/applications', label: 'Hồ sơ của tôi' },
    { key: '/candidate/results', label: 'Kết quả' },
    { key: '/candidate/profile', label: 'Thông tin cá nhân' },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <Menu
          theme="dark"
          mode="horizontal"
          items={menuItems}
          onClick={handleMenuClick}
          style={{ flex: 1 }}
        />
        <div style={{ color: '#fff', marginRight: 16 }}>{user?.email}</div>
        <Button onClick={handleLogout}>Đăng xuất</Button>
      </Header>
      <Content style={{ padding: 24, background: colorBgContainer, borderRadius: borderRadiusLG, margin: 24 }}>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default CandidateLayout;