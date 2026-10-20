import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, CircularProgress, Snackbar, TextField } from '@mui/material';
import { getShop, updateShop } from '../../api/shop';
import { useAuth } from '../../context/AuthContext';
import useFetch from '../../hooks/useFetch';

const FIELDS = ['name', 'owner_name', 'phone', 'address', 'city', 'state', 'gstin', 'website', 'review_link'];

function toForm(shop) {
  const f = {};
  FIELDS.forEach((k) => {
    f[k] = shop?.[k] ?? '';
  });
  return f;
}

function ShopProfileForm({ shop, onSaved }) {
  const { t } = useTranslation();
  const { can } = useAuth();
  const canEdit = can('settings', 'edit');

  const [form, setForm] = useState(() => toForm(shop));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [saved, setSaved] = useState(false);

  const setField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t('shop.nameRequired');
    if (!form.owner_name.trim()) e.owner_name = t('shop.ownerRequired');
    if (form.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(form.gstin)) {
      e.gstin = t('shop.gstinInvalid');
    }
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // blank optional fields -> null
    const payload = {};
    FIELDS.forEach((k) => {
      const v = String(form[k]).trim();
      payload[k] = v === '' ? null : v;
    });
    payload.name = form.name.trim();
    payload.owner_name = form.owner_name.trim();

    setSaving(true);
    try {
      await updateShop(payload);
      setSaved(true);
      onSaved();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (err.response?.status === 422 && apiErrors) {
        const mapped = {};
        Object.keys(apiErrors).forEach((k) => {
          mapped[k] = apiErrors[k][0];
        });
        setErrors(mapped);
      } else {
        setServerError(err.response?.data?.message || t('shop.genericError'));
      }
    } finally {
      setSaving(false);
    }
  };

  const text = (name, extra = {}) => (
    <TextField
      label={t(`shop.${name}`)}
      value={form[name]}
      onChange={(e) => setField(name, e.target.value)}
      error={Boolean(errors[name])}
      helperText={errors[name]}
      disabled={!canEdit}
      {...extra}
    />
  );

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ maxWidth: 760 }}>
      {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        {text('name', { label: `${t('shop.name')} *` })}
        {text('owner_name', { label: `${t('shop.owner_name')} *` })}

        <TextField label={t('shop.mobile')} value={shop.mobile ?? ''} disabled helperText={t('shop.loginHint')} />
        <TextField label={t('shop.email')} value={shop.email ?? ''} disabled />

        {text('phone')}
        {text('gstin', {
          onChange: (e) => setField('gstin', e.target.value.toUpperCase().slice(0, 15)),
        })}

        {text('address', { multiline: true, minRows: 2, sx: { gridColumn: { sm: '1 / -1' } } })}
        {text('city')}
        {text('state')}
        {text('website')}
        {text('review_link')}
      </Box>

      {canEdit && (
        <Button
          type="submit"
          variant="contained"
          disabled={saving}
          sx={{ mt: 3, minHeight: 42 }}
        >
          {saving ? t('shop.saving') : t('shop.save')}
        </Button>
      )}

      <Snackbar
        open={saved}
        autoHideDuration={3000}
        onClose={() => setSaved(false)}
        message={t('shop.saved')}
      />
    </Box>
  );
}

export default function ShopProfile() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch(getShop);

  if (loading && !data) return <CircularProgress />;
  if (error) return <Alert severity="error">{t('shop.loadError')}</Alert>;

  return <ShopProfileForm key={data.id} shop={data} onSaved={reload} />;
}
