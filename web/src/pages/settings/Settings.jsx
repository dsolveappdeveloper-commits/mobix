import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Tab, Tabs, Typography } from '@mui/material';

const tabs = [
  { labelKey: 'settings.branches', path: '/settings/branches' },
  { labelKey: 'settings.staff', path: '/settings/staff' },
  { labelKey: 'settings.roles', path: '/settings/roles' },
];

export default function Settings() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  // URl tag select to find
  const current = tabs.find((tab) => pathname.startsWith(tab.path))?.path ?? false;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>{t('settings.title')}</Typography>

      <Tabs value={current} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {tabs.map((tab) => (
          <Tab
            key={tab.path}
            value={tab.path}
            label={t(tab.labelKey)}
            component={RouterLink}
            to={tab.path}
          />
        ))}
      </Tabs>

      <Outlet />
    </Box>
  );
}