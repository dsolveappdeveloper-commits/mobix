import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import client from './api/client';
import Login from './pages/Login';

function Home() {
  const logout = async () => {
    try {
      await client.post('/auth/logout');
    } finally {
      localStorage.removeItem('mobix_token');
      window.location.href = '/login';
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Logged in. Dashboard coming soon.</Typography>
      <Button variant="outlined" onClick={logout}>Logout</Button>
    </Box>
  );
}

function RequireAuth({ children }) {
  return localStorage.getItem('mobix_token') ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}