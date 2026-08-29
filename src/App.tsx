import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/Upload';
import Charts from './pages/Charts';
import MileagePage from './pages/Mileage';
import Settings from './pages/Settings';
import ApmmPage from './pages/ApmmPage';
import Incidents from './pages/Incidents';
import Injuries from './pages/Injuries';
import NewHire from './pages/NewHire';
import Distracted from './pages/Distracted';
import Dot from './pages/Dot';
import UnclassifiedPage from './pages/UnclassifiedPage';
import Claims from './pages/Claims';
import Methodology from './pages/Methodology';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/apmm" element={<ApmmPage />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/injuries" element={<Injuries />} />
              <Route path="/new-hire" element={<NewHire />} />
              <Route path="/distracted" element={<Distracted />} />
              <Route path="/dot" element={<Dot />} />
              <Route path="/unclassified" element={<UnclassifiedPage />} />
              <Route path="/mileage" element={<MileagePage />} />
              <Route path="/claims" element={<Claims />} />
              <Route path="/methodology" element={<Methodology />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/data" element={<Navigate to="/incidents" replace />} />
              <Route path="/charts" element={<Charts />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
