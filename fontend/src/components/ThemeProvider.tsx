import React from 'react';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';

const antdTheme = {
  token: {
    colorPrimary: '#B30000',          // màu chính
    colorPrimaryHover: '#E60000',     // hover button, link
    colorLink: '#0038F7',             // link text
    colorLinkHover: '#002cb5',
    colorError: '#ff4d4f',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    borderRadius: 8,
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#1a1a1a',            // sidebar tối
      triggerBg: '#B30000',
    },
    Menu: {
      darkItemBg: '#1a1a1a',
      darkItemSelectedBg: '#B30000',
      darkItemHoverBg: '#E60000',
    },
    Button: {
      primaryColor: '#ffffff',
      defaultBg: '#ffffff',
      defaultBorderColor: '#B30000',
    },
  },
};

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ConfigProvider locale={viVN} theme={antdTheme}>
      {children}
    </ConfigProvider>
  );
};

export default ThemeProvider;