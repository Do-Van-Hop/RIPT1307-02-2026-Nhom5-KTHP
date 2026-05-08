import React from 'react';
import { Layout, Menu, Button, Avatar } from 'antd';
import {
  DashboardOutlined,
  BankOutlined,
  FileTextOutlined,
  BarChartOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Header, Sider, Content } = Layout;

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Tổng quan' },
    { key: '/admin/schools', icon: <BankOutlined />, label: 'Quản lý Trường' },
    { key: '/admin/majors', icon: <BankOutlined />, label: 'Quản lý Ngành' }, // có thể dùng icon khác
    { key: '/admin/subject-groups', icon: <BankOutlined />, label: 'Tổ hợp môn' },
    { key: '/admin/applications', icon: <FileTextOutlined />, label: 'Hồ sơ' },
    { key: '/admin/statistics', icon: <BarChartOutlined />, label: 'Thống kê' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible>
        <div style={{ height: 32, margin: 16, color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
          Admin Panel
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', background: '#fff' }}>
          <span style={{ marginRight: 16 }}>{user?.email}</span>
          <Button icon={<LogoutOutlined />} onClick={() => { logout(); navigate('/login'); }}>Đăng xuất</Button>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;