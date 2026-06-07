import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Tooltip, theme as antTheme } from 'antd';
import {
  DashboardOutlined,
  BankOutlined,
  FileTextOutlined,
  BarChartOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Header, Sider, Content } = Layout;

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { borderRadiusLG },
  } = antTheme.useToken();

  const menuItems = [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Tổng quan' },
    { key: '/admin/unified',   icon: <BankOutlined />,      label: 'Quản lý dữ liệu' },
    { key: '/admin/applications', icon: <FileTextOutlined />, label: 'Hồ sơ' },
    { key: '/admin/statistics', icon: <BarChartOutlined />,  label: 'Thống kê' },
  ];

  const handleMenuClick = ({ key }: { key: string }) => navigate(key);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Derive current page title
  const currentItem = menuItems.find((m) => m.key === location.pathname);
  const pageTitle = currentItem?.label ?? 'Admin Panel';

  return (
    <Layout className="min-h-screen bg-[#f5f5f7]">
      {/* ── SIDEBAR ── */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={240}
        className="!bg-[#1a1a1a] shadow-2xl"
        style={{ background: '#1a1a1a' }}
      >
        {/* Logo / Brand */}
        <div
          className={`flex items-center gap-3 px-5 transition-all duration-300 ${
            collapsed ? 'justify-center py-5' : 'py-5'
          }`}
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm leading-none">A</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-white font-semibold text-sm leading-tight tracking-wide whitespace-nowrap">
                Admin Panel
              </p>
              <p className="text-neutral/60 text-[11px] leading-tight whitespace-nowrap">
                Hệ thống quản trị
              </p>
            </div>
          )}
        </div>

        <div className="mx-4 h-px bg-white/10 mb-2" />

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={handleMenuClick}
          className="!bg-transparent !border-none"
          style={{ background: 'transparent', border: 'none' }}
          items={menuItems.map((item) => ({
            ...item,
            className: 'admin-menu-item',
            label: (
              <span className="font-medium tracking-wide text-[13px]">
                {item.label}
              </span>
            ),
          }))}
          theme="dark"
        />

        {/* Collapse toggle at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-3 flex justify-center">
          <Tooltip
            title={collapsed ? 'Mở rộng' : 'Thu gọn'}
            placement="right"
          >
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-primary/80 transition-colors duration-200 flex items-center justify-center text-white/60 hover:text-white"
            >
              {collapsed ? (
                <MenuUnfoldOutlined className="text-sm" />
              ) : (
                <MenuFoldOutlined className="text-sm" />
              )}
            </button>
          </Tooltip>
        </div>
      </Sider>

      {/* ── MAIN AREA ── */}
      <Layout className="!bg-[#f5f5f7]">
        {/* ── HEADER ── */}
        <Header
          className="!bg-white !px-6 flex items-center justify-between shadow-sm"
          style={{
            background: '#ffffff',
            padding: '0 24px',
            height: 64,
            lineHeight: '64px',
            boxShadow: '0 1px 0 0 #e5e7eb',
          }}
        >
          {/* Left: breadcrumb / page title */}
          <div className="flex items-center gap-3">
            <div className="h-5 w-1 rounded-full bg-primary" />
            <h1 className="text-[#1a1a1a] font-semibold text-base m-0 leading-none tracking-tight">
              {pageTitle}
            </h1>
          </div>
          {/* Right: user info + logout */}
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="flex items-center gap-2.5 px-3 py-1.5">
              <Avatar
                size={32}
                className="!bg-primary flex-shrink-0"
                style={{ background: '#B30000' }}
                icon={<UserOutlined />}
              />
              <div className="hidden md:flex flex-col items-start leading-none">
                <span className="text-[#1a1a1a] text-[13px] font-medium leading-tight max-w-[140px] truncate">
                  {user?.email ?? 'Admin'}
                </span>
                <span className="text-[#9ca3af] text-[11px] leading-tight">
                  Quản trị viên
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-[#e5e7eb]" />

            {/* Logout shortcut */}
            <Tooltip title="Đăng xuất">
              <Button
                type="default"
                danger
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                className="hidden md:flex items-center !border-primary/30 !text-primary hover:!bg-primary hover:!text-white !rounded-xl transition-all"
                size="middle"
              >
                <span className="text-[13px] font-medium">Đăng xuất</span>
              </Button>
            </Tooltip>
          </div>
        </Header>

        {/* ── CONTENT ── */}
        <Content
          className="overflow-auto"
          style={{ margin: 24, minHeight: 'calc(100vh - 64px - 48px)' }}
        >
          <div
            className="bg-white rounded-2xl shadow-sm p-6 min-h-full"
            style={{ borderRadius: borderRadiusLG, minHeight: 360 }}
          >
            <Outlet />
          </div>
        </Content>

        {/* ── FOOTER ── */}
        <footer className="text-center py-3 text-[#9ca3af] text-[12px] border-t border-[#e5e7eb] bg-white/60">
          © {new Date().getFullYear()} Admin Panel &mdash; Phiên bản 1.0
        </footer>
      </Layout>

      {/* ── GLOBAL SCOPED STYLES ── */}
      <style>{`
        .admin-menu-item.ant-menu-item {
          margin: 2px 12px !important;
          width: calc(100% - 24px) !important;
          border-radius: 10px !important;
          color: rgba(255,255,255,0.65) !important;
          transition: background 0.2s, color 0.2s !important;
        }
        .admin-menu-item.ant-menu-item:hover {
          background: rgba(227,0,0,0.15) !important;
          color: #fff !important;
        }
        .admin-menu-item.ant-menu-item-selected {
          background: #B30000 !important;
          color: #fff !important;
          box-shadow: 0 4px 12px rgba(179,0,0,0.35) !important;
        }
        .admin-menu-item .ant-menu-item-icon {
          font-size: 15px !important;
        }
        .ant-layout-sider-trigger {
          display: none !important;
        }
        .ant-layout-content::-webkit-scrollbar {
          width: 6px;
        }
        .ant-layout-content::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 3px;
        }
      `}</style>
    </Layout>
  );
};

export default AdminLayout;