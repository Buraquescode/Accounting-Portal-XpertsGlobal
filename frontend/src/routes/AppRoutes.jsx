import { Routes, Route } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleGate from './RoleGate';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import NewRequestPage from '../pages/NewRequestPage';
import RequestDetailPage from '../pages/RequestDetailPage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/requests/new" element={<RoleGate roles={['REQUESTER']}><NewRequestPage /></RoleGate>} />
          <Route path="/requests/:id" element={<RequestDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
