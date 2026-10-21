import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './layout/Layout';
import Login from './pages/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import LoginOtp from './pages/auth/LoginOtp';
import Settings from './pages/settings/Settings';
import ShopProfile from './pages/settings/ShopProfile';
import Preferences from './pages/settings/Preferences';
import Profile from './pages/Profile';
import Branches from './pages/settings/Branches';
import Staff from './pages/settings/Staff';
import RolesPermissions from './pages/settings/RolesPermissions';

// Temporary placeholder
function Dashboard() {
  const { me } = useAuth();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>Dashboard</Typography>
      <Typography color="text.secondary">
        Welcome back, {me.user.name}. Dashboard coming soon.
      </Typography>
    </Box>
  );
}

function RequirePermission({ module, children }) {
  const { can } = useAuth();
  return can(module) ? children : <Navigate to="/" replace />;
}

function RequireAuth({ children }) {
  const { me, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return me ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/login-otp" element={<LoginOtp />} />

          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />

            <Route
              path="/settings"
              element={<RequirePermission module="settings"><Settings /></RequirePermission>}
            >
              <Route index element={<Navigate to="shop" replace />} />
              <Route path="shop" element={<ShopProfile />} />
              <Route path="preferences" element={<Preferences />} />
              <Route path="branches" element={<Branches />} />
              <Route path="staff" element={<Staff />} />
              <Route path="roles" element={<RolesPermissions/>} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}