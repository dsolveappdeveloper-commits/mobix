import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './layout/Layout';
import Login from './pages/Login';
import Settings from './pages/settings/Settings';
import Branches from './pages/settings/Branches';

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

function Placeholder({ title }) {
  return <Typography color="text.secondary">{title} screen coming next.</Typography>;
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

          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="/" element={<Dashboard />} />

            <Route
              path="/settings"
              element={<RequirePermission module="settings"><Settings /></RequirePermission>}
            >
              <Route index element={<Navigate to="branches" replace />} />
              <Route path="branches" element={<Branches />} />
              <Route path="staff" element={<Placeholder title="Staff" />} />
              <Route path="roles" element={<Placeholder title="Roles" />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}