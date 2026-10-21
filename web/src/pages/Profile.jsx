import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Paper, Snackbar, TextField, Typography } from '@mui/material';
import PasswordField from '../components/PasswordField';
import { changePassword, updateProfile } from '../api/profile';
import { useAuth } from '../context/AuthContext';

const firstErrors = (apiErrors) =>
  Object.fromEntries(Object.entries(apiErrors).map(([k, v]) => [k, v[0]]));

export default function Profile() {
  const { t } = useTranslation();
  const { me, refreshMe } = useAuth();

  const [snack, setSnack] = useState('');

  // ---- Details form ----
  const [name, setName] = useState(me.user.name);
  const [email, setEmail] = useState(me.user.email ?? '');
  const [dErrors, setDErrors] = useState({});
  const [dBusy, setDBusy] = useState(false);

  const saveDetails = async (ev) => {
    ev.preventDefault();

    const e = {};
    if (!name.trim()) e.name = t('profile.nameRequired');
    if (email && !/^\S+@\S+\.\S+$/.test(email)) e.email = t('profile.emailInvalid');
    setDErrors(e);
    if (Object.keys(e).length > 0) return;

    setDBusy(true);
    try {
      await updateProfile({ name: name.trim(), email: email.trim() || null });
      await refreshMe(); // top bar la name update aagum
      setSnack(t('profile.saved'));
    } catch (err) {
      if (err.response?.status === 422 && err.response.data.errors) {
        setDErrors(firstErrors(err.response.data.errors));
      } else {
        setSnack(err.response?.data?.message || t('profile.genericError'));
      }
    } finally {
      setDBusy(false);
    }
  };

  // ---- Password form ----
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pErrors, setPErrors] = useState({});
  const [pBusy, setPBusy] = useState(false);

  const setPwField = (field, value) => {
    setPw((p) => ({ ...p, [field]: value }));
    setPErrors((e) => ({ ...e, [field]: undefined }));
  };

  const savePassword = async (ev) => {
    ev.preventDefault();

    const e = {};
    if (!pw.current) e.current = t('profile.currentRequired');
    if (pw.next.length < 8) e.next = t('profile.passwordShort');
    if (pw.confirm !== pw.next) e.confirm = t('profile.passwordMismatch');
    setPErrors(e);
    if (Object.keys(e).length > 0) return;

    setPBusy(true);
    try {
      await changePassword({
        current_password: pw.current,
        password: pw.next,
        password_confirmation: pw.confirm,
      });
      setPw({ current: '', next: '', confirm: '' });
      setSnack(t('profile.passwordChanged'));
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (err.response?.status === 422 && apiErrors) {
        // API names: current_password, password -> form names: current, next
        setPErrors({
          current: apiErrors.current_password?.[0],
          next: apiErrors.password?.[0],
        });
      } else {
        setSnack(err.response?.data?.message || t('profile.genericError'));
      }
    } finally {
      setPBusy(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>{t('profile.title')}</Typography>

      <Paper variant="outlined" sx={{ borderColor: 'divider', p: { xs: 2, md: 3 }, mb: 2 }}>
        <Box component="form" onSubmit={saveDetails} noValidate sx={{ display: 'grid', gap: 2 }}>
          <TextField
            label={`${t('profile.name')} *`}
            value={name}
            onChange={(e) => { setName(e.target.value); setDErrors((x) => ({ ...x, name: undefined })); }}
            error={Boolean(dErrors.name)}
            helperText={dErrors.name}
          />
          <TextField label={t('profile.mobile')} value={me.user.mobile} disabled helperText={t('profile.mobileHint')} />
          <TextField
            label={t('profile.email')}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setDErrors((x) => ({ ...x, email: undefined })); }}
            error={Boolean(dErrors.email)}
            helperText={dErrors.email}
          />
          <Box>
            <Button type="submit" variant="contained" disabled={dBusy} sx={{ minHeight: 44 }}>
              {dBusy ? t('profile.saving') : t('profile.save')}
            </Button>
          </Box>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ borderColor: 'divider', p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" sx={{ mb: 2 }}>{t('profile.passwordTitle')}</Typography>
        <Box component="form" onSubmit={savePassword} noValidate sx={{ display: 'grid', gap: 2 }}>
          <PasswordField
            label={t('profile.current')}
            value={pw.current}
            onChange={(e) => setPwField('current', e.target.value)}
            error={Boolean(pErrors.current)}
            helperText={pErrors.current}
            autoComplete="current-password"
          />
          <PasswordField
            label={t('profile.new')}
            value={pw.next}
            onChange={(e) => setPwField('next', e.target.value)}
            error={Boolean(pErrors.next)}
            helperText={pErrors.next}
            autoComplete="new-password"
          />
          <PasswordField
            label={t('profile.confirm')}
            value={pw.confirm}
            onChange={(e) => setPwField('confirm', e.target.value)}
            error={Boolean(pErrors.confirm)}
            helperText={pErrors.confirm}
            autoComplete="new-password"
          />
          <Box>
            <Button type="submit" variant="contained" color="secondary" disabled={pBusy} sx={{ minHeight: 44 }}>
              {t('profile.change')}
            </Button>
          </Box>
        </Box>
      </Paper>

      <Snackbar open={Boolean(snack)} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}