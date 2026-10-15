import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText, Typography,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { brand } from '../theme';
import { menuItems } from './menu';
import logoIcon from '../assets/logo-icon.png';

export default function Sidebar({ onNavigate }) {
  const { t } = useTranslation();
  const { can } = useAuth();
  const { pathname } = useLocation();

  // role ku permission illatha menu items remove aagidum
  const visibleItems = menuItems.filter((item) => can(item.module));

  const isActive = (path) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  return (
    <Box
      sx={{
        height: '100%',
        bgcolor: brand.navy,
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 2.5 }}>
        <Box
          sx={{
            width: 44, height: 44, bgcolor: '#fff', borderRadius: '12px',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}
        >
          <Box component="img" src={logoIcon} alt="" sx={{ width: 30, height: 30 }} />
        </Box>
        <Box>
          <Typography sx={{ fontFamily: '"Poppins", sans-serif', fontWeight: 700, fontSize: 22, lineHeight: 1.1 }}>
            Mobi<Box component="span" sx={{ color: '#4C9AFF' }}>X</Box>
          </Typography>
          <Typography sx={{ fontSize: 8, letterSpacing: 1.2, opacity: 0.8 }}>
            REPAIR SHOP MANAGEMENT
          </Typography>
        </Box>
      </Box>

      {/* Menu */}
      <List sx={{ px: 1.5, py: 1 }}>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <ListItemButton
              key={item.path}
              component={RouterLink}
              to={item.path}
              selected={isActive(item.path)}
              onClick={onNavigate}
              sx={{
                borderRadius: '10px',
                mb: 0.5,
                py: 1.1,
                color: 'rgba(255,255,255,0.85)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                '&.Mui-selected': {
                  bgcolor: brand.blue,
                  color: '#fff',
                  '&:hover': { bgcolor: brand.blue },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={t(item.labelKey)}
                slotProps={{ primary: { fontSize: 14, fontWeight: 500 } }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}