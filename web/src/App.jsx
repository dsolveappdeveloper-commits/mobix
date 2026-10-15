import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './layout/Layout';
import Login from './pages/Login';

// Temporary placeholder, real Dashboard Phase 6 la varum
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

          {/* Login aana pages ellam Layout kulla varum */}
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="/" element={<Dashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}