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
import SchoolManagement from './pages/admin/SchoolManagement';
import MajorManagement from './pages/admin/MajorManagement';
import SubjectGroupManagement from './pages/admin/SubjectGroupManagement';
import MyApplications from './pages/candidate/Applications';
import ApplicationForm from './pages/candidate/ApplicationForm';
import ApplicationDetail from './pages/candidate/ApplicationDetail';
import AdminApplicationList from './pages/admin/ApplicationList';
import AdminApplicationDetail from './pages/admin/ApplicationDetail';
import Statistics from './pages/admin/Statistics';
import NotFound from './pages/NotFound';
import Forbidden from './pages/Forbidden';

const Dashboard = () => <div>Admin Dashboard</div>;
const CandidateApplications = () => <div>Danh sách hồ sơ</div>;
const CandidateResults = () => <div>Kết quả</div>;

const queryClient = new QueryClient();

const App: React.FC = () => {
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN}>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Candidate */}
            <Route element={<ProtectedRoute allowedRoles={['candidate']} />}>
              <Route path="/candidate" element={<CandidateLayout />}>
                <Route index element={<Navigate to="applications" replace />} />
                <Route path="applications" element={<CandidateApplications />} />
                <Route path="results" element={<CandidateResults />} />
                <Route index element={<Navigate to="applications" replace />} />
                <Route path="applications" element={<MyApplications />} />
                <Route path="applications/new" element={<ApplicationForm />} />
                <Route path="applications/:id" element={<ApplicationDetail />} />
                <Route path="applications/:id/edit" element={<ApplicationForm />} />
              </Route>
            </Route>

            {/* Admin */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="schools" element={<SchoolManagement />} />
                <Route path="majors" element={<MajorManagement />} />
                <Route path="subject-groups" element={<SubjectGroupManagement />} />
                <Route path="applications" element={<AdminApplicationList />} />
                <Route path="applications/:id" element={<AdminApplicationDetail />} />
                <Route path="statistics" element={<Statistics />} />
              </Route>
            </Route>

            {/* Redirect mặc định */}
            <Route path="*" element={<Navigate to="/login" replace />} />
            <Route path="/forbidden" element={<Forbidden />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App;