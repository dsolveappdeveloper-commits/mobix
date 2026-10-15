import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';

function Home() {
  const { me, logout, can } = useAuth();

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Hi {me.user.name} ({me.role.name})
      </Typography>
      <Typography sx={{ mb: 2 }}>
        Settings access: {can('settings') ? 'Yes' : 'No'} | Branches: {me.branches.length}
      </Typography>
      <Button variant="outlined" onClick={logout}>Logout</Button>
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
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}