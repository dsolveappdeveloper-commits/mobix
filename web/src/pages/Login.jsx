import { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert, Box, Button, Checkbox, Divider, FormControlLabel, IconButton,
  InputAdornment, Link, Paper, TextField, Typography,
} from '@mui/material';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ArrowForward from '@mui/icons-material/ArrowForward';
import PhoneIphone from '@mui/icons-material/PhoneIphone';
import VerifiedUserOutlined from '@mui/icons-material/VerifiedUserOutlined';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import GppGoodOutlined from '@mui/icons-material/GppGoodOutlined';
import client from '../api/client'; 
import { useAuth } from '../context/AuthContext';
import { brand } from '../theme';
import logo from '../assets/logo.png';
import hero from '../assets/hero.png';

function Feature({ icon, text }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box
        sx={{
          width: 48, height: 48, borderRadius: '12px', display: 'grid',
          placeItems: 'center', bgcolor: '#DCEBFE', color: brand.blue,
        }}
      >
        {icon}
      </Box>
      <Typography sx={{ fontSize: 14, color: brand.text, maxWidth: 110, lineHeight: 1.3 }}>
        {text}
      </Typography>
    </Box>
  );
}

function FieldLabel({ children }) {
  return (
    <Typography sx={{ fontSize: 14, fontWeight: 600, color: brand.text, mb: 0.75 }}>
      {children}
    </Typography>
  );
}

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password) {
      setError(t('login.required'));
      return;
    }

    setLoading(true);
    try {
      const res = await client.post('/auth/login', {
        identifier: identifier.trim(),
        password,
        remember,
      });
      await login(res.data.token);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || t('login.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.15fr 1fr' },
        background: 'linear-gradient(135deg, #D9E9FD 0%, #EAF3FE 35%, #F6FAFF 100%)',
      }}
    >
      {/* Left: brand + illustration (hidden on phones) */}
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
          <Typography sx={{ fontSize: 18, color: brand.muted, maxWidth: 480, mb: 4 }}>
            {t('login.subtitle')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Feature icon={<VerifiedUserOutlined />} text={t('login.feature1')} />
            <Feature icon={<Inventory2Outlined />} text={t('login.feature2')} />
            <Feature icon={<ReceiptLongOutlined />} text={t('login.feature3')} />
          </Box>
        </Box>
        <Box component="img" src={hero} alt="" sx={{ width: '100%', maxWidth: 760, mt: 3, alignSelf: 'center' }} />
      </Box>

      {/* Right: login card */}
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
            <Box component="img" src={logo} alt="MobiX" sx={{ height: 84, mb: 1 }} />
            <Typography variant="h4" sx={{ fontSize: 30, color: brand.navy }}>
              {t('login.welcome')}
            </Typography>
            <Typography sx={{ color: brand.muted, mt: 0.5 }}>{t('login.signInTo')}</Typography>
          </Box>

           {location.state?.loggedOut && !error && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {t('login.loggedOut')}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <FieldLabel>{t('login.identifier')}</FieldLabel>
            <TextField
              fullWidth
              autoFocus
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={t('login.identifierPlaceholder')}
              autoComplete="username"
              sx={{ mb: 2.5 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                    <EmailOutlined sx={{ color: brand.muted }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <FieldLabel>{t('login.password')}</FieldLabel>
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login.passwordPlaceholder')}
              autoComplete="current-password"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined sx={{ color: brand.muted }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label="toggle password visibility"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, mb: 2.5 }}>
              <FormControlLabel
                control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
                label={t('login.remember')}
              />
              <Link component={RouterLink} to="/forgot-password" underline="hover" sx={{ fontWeight: 600, fontSize: 14 }}>
                {t('login.forgot')}
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="secondary"
              disabled={loading}
              endIcon={<ArrowForward />}
              sx={{ minHeight: 52, fontSize: 16 }}
            >
              {loading ? t('login.signingIn') : t('login.signIn')}
            </Button>

            <Divider sx={{ my: 2.5, color: brand.muted, fontSize: 12 }}>{t('login.or')}</Divider>

            <Button
              fullWidth
              variant="outlined"
              disabled
              startIcon={<PhoneIphone />}
              sx={{ minHeight: 52, fontSize: 16 }}
            >
              {t('login.signInOtp')}
            </Button>

            <Typography sx={{ textAlign: 'center', mt: 3, fontSize: 14, color: brand.muted }}>
              {t('login.newTo')}{' '}
              <Link component={RouterLink} to="/register" underline="hover" sx={{ fontWeight: 600 }}>
                {t('login.createAccount')}
              </Link>
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.75, mt: 3, color: brand.muted }}>
              <GppGoodOutlined sx={{ fontSize: 18 }} />
              <Typography sx={{ fontSize: 12 }}>{t('login.secure')}</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}