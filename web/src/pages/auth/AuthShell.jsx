import { useTranslation } from 'react-i18next';
import { Box, Paper, Typography } from '@mui/material';
import { brand } from '../../theme';
import logo from '../../assets/logo.png';
import hero from '../../assets/hero.png';

export default function AuthShell({ title, subtitle, children }) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.15fr 1fr' },
        background: 'linear-gradient(135deg, #D9E9FD 0%, #EAF3FE 35%, #F6FAFF 100%)',
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { md: 5, lg: 8 },
          overflow: 'hidden',
        }}
      >
        <Box>
          <Box component="img" src={logo} alt="MobiX" sx={{ height: 104, mb: 3, ml: -1 }} />
          <Typography variant="h2" sx={{ fontSize: { md: 44, lg: 56 }, lineHeight: 1.1, color: brand.navy }}>
            {t('login.headline1')}
          </Typography>
          <Typography variant="h2" sx={{ fontSize: { md: 44, lg: 56 }, lineHeight: 1.1, color: brand.blue, mb: 2 }}>
            {t('login.headline2')}
          </Typography>
          <Typography sx={{ fontSize: 18, color: brand.muted, maxWidth: 480 }}>
            {t('login.subtitle')}
          </Typography>
        </Box>
        <Box component="img" src={hero} alt="" sx={{ width: '100%', maxWidth: 760, mt: 3, alignSelf: 'center' }} />
      </Box>

      <Box sx={{ display: 'grid', placeItems: 'center', p: { xs: 2, md: 4 } }}>
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 520,
            p: { xs: 3, sm: 5 },
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(30, 111, 232, 0.12)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box component="img" src={logo} alt="MobiX" sx={{ height: 72, mb: 1 }} />
            <Typography variant="h4" sx={{ fontSize: 28, color: brand.navy }}>{title}</Typography>
            {subtitle && <Typography sx={{ color: brand.muted, mt: 0.5 }}>{subtitle}</Typography>}
          </Box>
          {children}
        </Paper>
      </Box>
    </Box>
  );
}