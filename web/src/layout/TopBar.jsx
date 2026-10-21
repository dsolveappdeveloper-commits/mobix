import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Avatar, Badge, Box, Button, Divider, IconButton, InputBase, ListItemIcon,
  Menu, MenuItem, Select, Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import AddIcon from '@mui/icons-material/Add';
import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import BuildOutlined from '@mui/icons-material/BuildOutlined';
import ShoppingCartOutlined from '@mui/icons-material/ShoppingCartOutlined';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import { useAuth } from '../context/AuthContext';
import { brand, layout } from '../theme';

export default function TopBar({ onMenuClick }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { me, can, logout, branchId, setBranchId } = useAuth();

  const [search, setSearch] = useState('');
  const [newAnchor, setNewAnchor] = useState(null);   // "+ New" menu
  const [userAnchor, setUserAnchor] = useState(null); // user menu

  // ---- Branch switcher ----
  const isAdmin = me.role.name === 'Admin';
  const branchOptions = isAdmin
    ? [{ id: 'all', name: t('topbar.allBranches') }, ...me.branches]
    : me.branches;
  const selected = branchOptions.some((b) => String(b.id) === branchId)
    ? branchId
    : String(branchOptions[0]?.id ?? '');

  // ---- "+ New" menu (role ku create permission irundha mattum) ----
  const newItems = [
    { label: t('topbar.newJob'), icon: BuildOutlined, path: '/jobs/new', allowed: can('jobs', 'create') },
    { label: t('topbar.newSale'), icon: ShoppingCartOutlined, path: '/sales', allowed: can('sales', 'create') },
    { label: t('topbar.newCustomer'), icon: PersonAddAltOutlined, path: '/customers/new', allowed: can('customers', 'create') },
  ].filter((item) => item.allowed);

  const handleSearchKey = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/jobs?q=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleLogout = () => {
    setUserAnchor(null);
    navigate('/login', { replace: true, state: { loggedOut: true } });
    logout();
  };

  return (
    <Box
      sx={{
        height: layout.topbarHeight,
        bgcolor: brand.navy,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, md: 2 },
        px: { xs: 1.5, md: 3 },
        boxShadow: '0 2px 8px rgba(15, 59, 120, 0.25)',
      }}
    >
      {/* Mobile: hamburger */}
      <IconButton onClick={onMenuClick} sx={{ color: '#fff', display: { md: 'none' } }}>
        <MenuIcon />
      </IconButton>

      {/* Branch switcher */}
      <Select
        value={selected}
        onChange={(e) => setBranchId(e.target.value)}
        size="small"
        startAdornment={<StorefrontOutlined sx={{ mr: 1, color: brand.navy }} />}
        sx={{ bgcolor: '#fff', height: 42, minWidth: { xs: 120, md: 180 }, fontSize: 14, fontWeight: 500 }}
      >
        {branchOptions.map((b) => (
          <MenuItem key={b.id} value={String(b.id)}>
            {b.name}
          </MenuItem>
        ))}
      </Select>

      {/* Global search (desktop) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          flex: 1,
          maxWidth: 560,
          height: 42,
          px: 1.5,
          borderRadius: '10px',
          bgcolor: 'rgba(255,255,255,0.14)',
        }}
      >
        <SearchOutlined sx={{ mr: 1, color: 'rgba(255,255,255,0.8)' }} />
        <InputBase
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKey}
          placeholder={t('topbar.searchPlaceholder')}
          sx={{
            flex: 1,
            color: '#fff',
            fontSize: 14,
            '& input::placeholder': { color: 'rgba(255,255,255,0.75)', opacity: 1 },
          }}
        />
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      {/* + New */}
      {newItems.length > 0 && (
        <>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={(e) => setNewAnchor(e.currentTarget)}
            sx={{ minHeight: 42, px: { xs: 1.5, md: 2.5 } }}
          >
            {t('topbar.new')}
          </Button>
          <Menu anchorEl={newAnchor} open={Boolean(newAnchor)} onClose={() => setNewAnchor(null)}>
            {newItems.map((item) => {
              const Icon = item.icon;
              return (
                <MenuItem
                  key={item.path}
                  onClick={() => {
                    setNewAnchor(null);
                    navigate(item.path);
                  }}
                >
                  <ListItemIcon><Icon fontSize="small" /></ListItemIcon>
                  {item.label}
                </MenuItem>
              );
            })}
          </Menu>
        </>
      )}

      {/* Notifications (placeholder: count 0) */}
      <IconButton sx={{ color: '#fff' }} aria-label={t('topbar.notifications')}>
        <Badge badgeContent={0} color="error">
          <NotificationsNoneOutlined />
        </Badge>
      </IconButton>

      {/* User menu */}
      <Box
        onClick={(e) => setUserAnchor(e.currentTarget)}
        sx={{ display: 'flex', alignItems: 'center', gap: 1.25, cursor: 'pointer', pl: 1 }}
      >
        <Avatar sx={{ width: 36, height: 36, bgcolor: brand.blue, fontSize: 15 }}>
          {me.user.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ display: { xs: 'none', md: 'block' }, lineHeight: 1.2 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{me.user.name}</Typography>
          <Typography sx={{ fontSize: 12, opacity: 0.8 }}>{me.role.name}</Typography>
        </Box>
      </Box>
      <Menu anchorEl={userAnchor} open={Boolean(userAnchor)} onClose={() => setUserAnchor(null)}>
        <Box sx={{ px: 2, py: 1 }}>
          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{me.user.name}</Typography>
          <Typography sx={{ fontSize: 12, color: brand.muted }}>{me.user.mobile}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { setUserAnchor(null); navigate('/profile'); }}>
          <ListItemIcon><PersonOutline fontSize="small" /></ListItemIcon>
          {t('topbar.profile')}
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><LogoutOutlined fontSize="small" /></ListItemIcon>
          {t('topbar.logout')}
        </MenuItem>
      </Menu>
    </Box>
  );
}