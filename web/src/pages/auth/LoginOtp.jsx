import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert, Box, Button, Checkbox, FormControlLabel, Link, TextField, Typography,
} from '@mui/material';
import AuthShell from './AuthShell';
import { sendLoginOtp, verifyLoginOtp } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { apiMessage } from '../../utils/apiError';

export default function LoginOtp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState('mobile'); // 'mobile' -> 'otp'
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async (ev) => {
    ev?.preventDefault();
    setError('');

    if (!/^\d{10}$/.test(mobile)) {
      setError(t('auth.mobileInvalid'));
      return;
    }

    setBusy(true);
    try {
      await sendLoginOtp(mobile);
      setStep('otp');
    } catch (err) {
      setError(apiMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (ev) => {
    ev.preventDefault();
    setError('');

    if (!/^\d{6}$/.test(otp)) {
      setError(t('auth.otpInvalid'));
      return;
    }

    setBusy(true);
    try {
      const res = await verifyLoginOtp({ mobile, otp, remember });
      await login(res.data.token);
      navigate('/', { replace: true });
    } catch (err) {
      setError(apiMessage(err, t));
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={t('auth.otpLogin.title')}
      subtitle={step === 'otp' ? t('auth.otpHelp') : t('auth.otpLogin.subtitle')}
    >
      {step === 'otp' && import.meta.env.DEV && (
        <Alert severity="info" sx={{ mb: 2 }}>{t('auth.otpDevHint')}</Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {step === 'mobile' ? (
        <Box component="form" onSubmit={send} noValidate sx={{ display: 'grid', gap: 2 }}>
          <TextField
            label={t('auth.otpLogin.mobile')}
            value={mobile}
            onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
            autoFocus
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
          />
          <Button type="submit" variant="contained" color="secondary" disabled={busy} sx={{ minHeight: 52 }}>
            {busy ? t('auth.sending') : t('auth.otpLogin.sendOtp')}
          </Button>
        </Box>
      ) : (
        <Box component="form" onSubmit={verify} noValidate sx={{ display: 'grid', gap: 2 }}>
          <TextField
            label={t('auth.otp')}
            value={otp}
            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
            autoFocus
            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6 } }}
          />
          <FormControlLabel
            control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
            label={t('auth.otpLogin.remember')}
          />
          <Button type="submit" variant="contained" color="secondary" disabled={busy} sx={{ minHeight: 52 }}>
            {busy ? t('auth.verifying') : t('auth.otpLogin.signIn')}
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button size="small" onClick={() => setStep('mobile')} disabled={busy}>{t('auth.edit')}</Button>
            <Button size="small" onClick={() => send()} disabled={busy}>{t('auth.resend')}</Button>
          </Box>
        </Box>
      )}

      <Typography sx={{ textAlign: 'center', mt: 3, fontSize: 14 }}>
        <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 600 }}>
          {t('auth.back')}
        </Link>
      </Typography>
    </AuthShell>
  );
}