import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/Upload';
import Charts from './pages/Charts';
import Data from './pages/Data';
import MileagePage from './pages/Mileage';
import Settings from './pages/Settings';
import { AnalyticsProvider } from './lib/AnalyticsProvider';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <AnalyticsProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/charts" element={<Charts />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/data" element={<Data />} />
              <Route path="/mileage" element={<MileagePage />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </AnalyticsProvider>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
