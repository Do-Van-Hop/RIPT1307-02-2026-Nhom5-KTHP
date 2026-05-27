import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import CandidateLayout from './layouts/CandidateLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import MyApplications from './pages/candidate/Applications';
import ApplicationForm from './pages/candidate/ApplicationForm';
import ApplicationDetail from './pages/candidate/ApplicationDetail';
import AdminApplicationList from './pages/admin/ApplicationList';
import AdminApplicationDetail from './pages/admin/ApplicationDetail';
import Statistics from './pages/admin/Statistics';
import NotFound from './pages/NotFound';
import Forbidden from './pages/Forbidden';
import Dashboard from './pages/admin/Dashboard';
import Profile from './pages/candidate/Profile';
import Results from './pages/candidate/Results';
import UnifiedManagement from './pages/admin/UnifiedManagement';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const App: React.FC = () => {
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN}>
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Candidate routes */}
              <Route element={<ProtectedRoute allowedRoles={['candidate']} />}>
                <Route path="/candidate" element={<CandidateLayout />}>
                  <Route index element={<Navigate to="applications" replace />} />
                  <Route path="applications" element={<MyApplications />} />
                  <Route path="applications/new" element={<ApplicationForm />} />
                  <Route path="applications/:id" element={<ApplicationDetail />} />
                  <Route path="applications/:id/edit" element={<ApplicationForm />} />
                  <Route path="results" element={<Results />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
              </Route>

              {/* Admin routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="unified" element={<UnifiedManagement />} />
                  <Route path="applications" element={<AdminApplicationList />} />
                  <Route path="applications/:id" element={<AdminApplicationDetail />} />
                  <Route path="statistics" element={<Statistics />} />
                </Route>
              </Route>

              {/* Fallback routes */}
              <Route path="/forbidden" element={<Forbidden />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App;