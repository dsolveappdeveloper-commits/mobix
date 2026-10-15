import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Drawer } from '@mui/material';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { brand, layout } from '../theme';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const paper = { width: layout.sidebarWidth, border: 'none', bgcolor: brand.navy };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Mobile: slide-in drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': paper }}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      {/* Desktop: always visible */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          width: layout.sidebarWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': paper,
        }}
      >
        <Sidebar />
      </Drawer>

      {/* Right side: top bar + page content */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}