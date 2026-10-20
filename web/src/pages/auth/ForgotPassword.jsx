import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Link, TextField, Typography } from '@mui/material';
import AuthShell from './AuthShell';
import PasswordField from '../../components/PasswordField';
import { forgotPassword, resetPassword } from '../../api/auth';
import { apiMessage } from '../../utils/apiError';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState('request'); // 'request' -> 'reset'
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const request = async (ev) => {
    ev?.preventDefault();
    setServerError('');

    if (!identifier.trim()) {
      setErrors({ identifier: t('auth.required') });
      return;
    }

    setBusy(true);
    try {
      await forgotPassword(identifier.trim());
      setStep('reset'); // account irukka illaiyanu server sollaadhu, adhanaala eppavum next step
    } catch (err) {
      setServerError(apiMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  const reset = async (ev) => {
    ev.preventDefault();
    setServerError('');

    const e = {};
    if (!/^\d{6}$/.test(otp)) e.otp = t('auth.otpInvalid');
    if (password.length < 8) e.password = t('auth.passwordShort');
    if (confirm !== password) e.confirm = t('auth.passwordMismatch');
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setBusy(true);
    try {
      await resetPassword({
        identifier: identifier.trim(),
        otp,
        password,
        password_confirmation: confirm,
      });
      navigate('/login', { replace: true, state: { passwordReset: true } });
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (err.response?.status === 422 && apiErrors?.password) {
        setErrors({ password: apiErrors.password[0] });
      } else {
        setServerError(apiMessage(err, t)); // "Invalid or expired OTP."
      }
      setBusy(false);
    }
  };

  const backLink = (
    <Typography sx={{ textAlign: 'center', mt: 3, fontSize: 14 }}>
      <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 600 }}>
        {t('auth.back')}
      </Link>
    </Typography>
  );

  if (step === 'reset') {
    return (
      <AuthShell title={t('auth.forgot.resetTitle')} subtitle={t('auth.otpHelp')}>
        {import.meta.env.DEV && <Alert severity="info" sx={{ mb: 2 }}>{t('auth.otpDevHint')}</Alert>}
        {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

        <Box component="form" onSubmit={reset} noValidate sx={{ display: 'grid', gap: 2 }}>
          <TextField
            label={t('auth.otp')}
            value={otp}
            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrors((x) => ({ ...x, otp: undefined })); }}
            error={Boolean(errors.otp)}
            helperText={errors.otp}
            autoFocus
            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6 } }}
          />
          <PasswordField
            label={t('auth.forgot.newPassword')}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((x) => ({ ...x, password: undefined })); }}
            error={Boolean(errors.password)}
            helperText={errors.password}
            autoComplete="new-password"
          />
          <PasswordField
            label={t('auth.forgot.confirmPassword')}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setErrors((x) => ({ ...x, confirm: undefined })); }}
            error={Boolean(errors.confirm)}
            helperText={errors.confirm}
            autoComplete="new-password"
          />
          <Button type="submit" variant="contained" color="secondary" disabled={busy} sx={{ minHeight: 52 }}>
            {t('auth.forgot.reset')}
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button size="small" onClick={() => setStep('request')} disabled={busy}>{t('auth.edit')}</Button>
            <Button size="small" onClick={() => request()} disabled={busy}>{t('auth.resend')}</Button>
          </Box>
        </Box>
        {backLink}
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('auth.forgot.title')} subtitle={t('auth.forgot.subtitle')}>
      {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

      <Box component="form" onSubmit={request} noValidate sx={{ display: 'grid', gap: 2 }}>
        <TextField
          label={t('auth.forgot.identifier')}
          value={identifier}
          onChange={(e) => { setIdentifier(e.target.value); setErrors({}); }}
          error={Boolean(errors.identifier)}
          helperText={errors.identifier}
          autoFocus
        />
        <Button type="submit" variant="contained" color="secondary" disabled={busy} sx={{ minHeight: 52 }}>
          {busy ? t('auth.sending') : t('auth.forgot.sendOtp')}
        </Button>
      </Box>
      {backLink}
    </AuthShell>
  );
}