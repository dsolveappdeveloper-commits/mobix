import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Link, TextField, Typography } from '@mui/material';
import AuthShell from './AuthShell';
import PasswordField from '../../components/PasswordField';
import { registerShop, verifySignupOtp } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { apiMessage } from '../../utils/apiError';

const emptyForm = {
  shop_name: '', owner_name: '', mobile: '', email: '', password: '', city: '', gstin: '',
};

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState('form'); // 'form' -> 'otp'
  const [form, setForm] = useState(emptyForm);
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const setField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.shop_name.trim()) e.shop_name = t('auth.required');
    if (!form.owner_name.trim()) e.owner_name = t('auth.required');
    if (!/^\d{10}$/.test(form.mobile)) e.mobile = t('auth.mobileInvalid');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = t('auth.emailInvalid');
    if (form.password.length < 8) e.password = t('auth.passwordShort');
    if (form.gstin && form.gstin.length !== 15) e.gstin = t('auth.register.gstinInvalid');
    return e;
  };

  // Send OTP (Resend kooda idhe function)
  const sendOtp = async (ev) => {
    ev?.preventDefault();
    setServerError('');

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      await registerShop({
        ...form,
        city: form.city.trim() || null,
        gstin: form.gstin.trim() || null,
      });
      setStep('otp');
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (err.response?.status === 422 && apiErrors) {
        // "mobile already taken" maari errors field-wise
        setErrors(Object.fromEntries(Object.entries(apiErrors).map(([k, v]) => [k, v[0]])));
      } else {
        setServerError(apiMessage(err, t));
      }
    } finally {
      setBusy(false);
    }
  };

  const verify = async (ev) => {
    ev.preventDefault();
    setServerError('');

    if (!/^\d{6}$/.test(otp)) {
      setServerError(t('auth.otpInvalid'));
      return;
    }

    setBusy(true);
    try {
      const res = await verifySignupOtp({ mobile: form.mobile, otp });
      await login(res.data.token);
      navigate('/', { replace: true });
    } catch (err) {
      setServerError(apiMessage(err, t));
      setBusy(false);
    }
  };

  const field = (name, label, extra = {}) => (
    <TextField
      label={label}
      value={form[name]}
      onChange={(e) => setField(name, e.target.value)}
      error={Boolean(errors[name])}
      helperText={errors[name]}
      {...extra}
    />
  );

  // ---------- Step 2: OTP ----------
  if (step === 'otp') {
    return (
      <AuthShell title={t('auth.register.verifyTitle')} subtitle={t('auth.otpHelp')}>
        {import.meta.env.DEV && <Alert severity="info" sx={{ mb: 2 }}>{t('auth.otpDevHint')}</Alert>}
        {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

        <Box component="form" onSubmit={verify} noValidate sx={{ display: 'grid', gap: 2 }}>
          <TextField
            label={t('auth.otp')}
            value={otp}
            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setServerError(''); }}
            autoFocus
            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6 } }}
          />
          <Button type="submit" variant="contained" color="secondary" disabled={busy} sx={{ minHeight: 52 }}>
            {busy ? t('auth.verifying') : t('auth.register.create')}
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button size="small" onClick={() => setStep('form')} disabled={busy}>{t('auth.edit')}</Button>
            <Button size="small" onClick={() => sendOtp()} disabled={busy}>{t('auth.resend')}</Button>
          </Box>
        </Box>
      </AuthShell>
    );
  }

  // ---------- Step 1: Details ----------
  return (
    <AuthShell title={t('auth.register.title')} subtitle={t('auth.register.subtitle')}>
      {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

      <Box
        component="form"
        onSubmit={sendOtp}
        noValidate
        sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}
      >
        {field('shop_name', `${t('auth.register.shopName')} *`, { autoFocus: true })}
        {field('owner_name', `${t('auth.register.ownerName')} *`)}
        {field('mobile', `${t('auth.register.mobile')} *`, {
          onChange: (e) => setField('mobile', e.target.value.replace(/\D/g, '').slice(0, 10)),
        })}
        {field('email', `${t('auth.register.email')} *`)}
        <PasswordField
          label={`${t('auth.register.password')} *`}
          value={form.password}
          onChange={(e) => setField('password', e.target.value)}
          error={Boolean(errors.password)}
          helperText={errors.password}
          autoComplete="new-password"
        />
        {field('city', t('auth.register.city'))}
        {field('gstin', t('auth.register.gstin'), {
          onChange: (e) => setField('gstin', e.target.value.toUpperCase().slice(0, 15)),
          sx: { gridColumn: { sm: '1 / -1' } },
        })}

        <Button
          type="submit"
          variant="contained"
          color="secondary"
          disabled={busy}
          sx={{ minHeight: 52, gridColumn: { sm: '1 / -1' } }}
        >
          {busy ? t('auth.sending') : t('auth.register.sendOtp')}
        </Button>
      </Box>

      <Typography sx={{ textAlign: 'center', mt: 3, fontSize: 14 }} color="text.secondary">
        {t('auth.register.haveAccount')}{' '}
        <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 600 }}>
          {t('auth.back')}
        </Link>
      </Typography>
    </AuthShell>
  );
}