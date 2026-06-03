import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function ProtectedRoute() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}
