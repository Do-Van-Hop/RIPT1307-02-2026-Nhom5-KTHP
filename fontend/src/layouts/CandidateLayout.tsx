import React from 'react';
import { Layout, Menu, Button, Avatar, Tooltip, theme as antTheme } from 'antd';
import {
  FileTextOutlined,
  TrophyOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Header, Content } = Layout;

const CandidateLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const {
    token: { borderRadiusLG },
  } = antTheme.useToken();

  const menuItems = [
    { key: '/candidate/applications', icon: <FileTextOutlined />, label: 'Hồ sơ của tôi' },
    { key: '/candidate/results',      icon: <TrophyOutlined />,   label: 'Kết quả' },
    { key: '/candidate/profile',      icon: <UserOutlined />,     label: 'Thông tin cá nhân' },
  ];

  const handleMenuClick = ({ key }: { key: string }) => navigate(key);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentItem = menuItems.find((m) => m.key === location.pathname);
  const pageTitle = currentItem?.label ?? 'Cổng thí sinh';

  return (
    <Layout className="min-h-screen !bg-[#f5f5f7]">
      {/* ── HEADER ── */}
      <Header
        style={{
          background: '#ffffff',
          padding: '0 32px',
          height: 64,
          lineHeight: '64px',
          boxShadow: '0 1px 0 0 #e5e7eb',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
        className="flex items-center justify-between !bg-white"
      >
        {/* Left: Brand + Nav */}
        <div className="flex items-center gap-6">
          <div
            className="flex items-center gap-2.5 cursor-pointer flex-shrink-0"
            onClick={() => navigate('/candidate/applications')}
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/30">
              <span className="text-white font-bold text-sm leading-none">T</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-[#1a1a1a] font-semibold text-sm leading-tight m-0">Tuyển sinh</p>
              <p className="text-[#9ca3af] text-[11px] leading-tight m-0">Cổng thí sinh</p>
            </div>
          </div>

          <div className="w-px h-6 bg-[#e5e7eb] hidden sm:block" />

          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            onClick={handleMenuClick}
            className="!border-none !bg-transparent candidate-nav-menu"
            style={{ border: 'none', background: 'transparent', lineHeight: '62px' }}
            items={menuItems.map((item) => ({
              ...item,
              label: (
                <span className="text-[13px] font-medium tracking-wide">
                  {item.label}
                </span>
              ),
            }))}
          />
        </div>

        {/* Right: chỉ giữ avatar + logout (xóa notification + dropdown) */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex items-center gap-2.5 px-3 py-1.5">
            <Avatar
              size={32}
              className="flex-shrink-0"
              style={{ background: '#B30000' }}
              icon={<UserOutlined />}
            />
            <div className="hidden md:flex flex-col items-start leading-none">
              <span className="text-[#1a1a1a] text-[13px] font-medium leading-tight max-w-[160px] truncate">
                {user?.email ?? 'Thí sinh'}
              </span>
              <span className="text-[#9ca3af] text-[11px] leading-tight">Thí sinh</span>
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

      {/* ── PAGE TITLE BAR ── */}
      <div className="bg-white border-b border-[#e5e7eb] px-8 py-3 flex items-center gap-3">
        <div className="h-4 w-0.5 rounded-full bg-primary" />
        <h1 className="text-[#1a1a1a] font-semibold text-sm m-0 leading-none tracking-tight">
          {pageTitle}
        </h1>
        <div className="ml-auto">
          <span className="text-[#9ca3af] text-xs">Trang chủ / {pageTitle}</span>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <Content
        style={{ margin: 24, minHeight: 'calc(100vh - 64px - 44px - 48px)' }}
        className="overflow-auto"
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
        © {new Date().getFullYear()} Hệ thống tuyển sinh &mdash; Cổng thí sinh
      </footer>

      {/* ── SCOPED STYLES ── */}
      <style>{`
        .candidate-nav-menu .ant-menu-item {
          border-radius: 8px !important;
          margin: 0 2px !important;
          padding: 0 14px !important;
          color: #6b7280 !important;
          transition: color 0.2s, background 0.2s !important;
        }
        .candidate-nav-menu .ant-menu-item:hover {
          color: #B30000 !important;
          background: #fce8e8 !important;
        }
        .candidate-nav-menu .ant-menu-item-selected {
          color: #B30000 !important;
          background: #fce8e8 !important;
          font-weight: 600 !important;
        }
        .candidate-nav-menu .ant-menu-item::after,
        .candidate-nav-menu .ant-menu-item-selected::after {
          border-bottom: none !important;
          border-bottom-color: transparent !important;
        }
      `}</style>
    </Layout>
  );
};

export default CandidateLayout;