import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, MenuItem, Switch, TextField,
} from '@mui/material';
import { createCustomer, lookupCustomer, updateCustomer } from '../../api/customers';

const emptyForm = {
  name: '', mobile: '', alt_mobile: '', email: '', address: '', city: '', pincode: '',
  type: 'retail', gstin: '', dob: '', credit_limit: '', notes: '',
  marketing_consent: false, is_active: true,
};

function toForm(c) {
  if (!c) return emptyForm;
  return {
    name: c.name ?? '',
    mobile: c.mobile ?? '',
    alt_mobile: c.alt_mobile ?? '',
    email: c.email ?? '',
    address: c.address ?? '',
    city: c.city ?? '',
    pincode: c.pincode ?? '',
    type: c.type ?? 'retail',
    gstin: c.gstin ?? '',
    dob: c.dob ?? '',
    credit_limit: c.credit_limit && Number(c.credit_limit) > 0 ? String(Number(c.credit_limit)) : '',
    notes: c.notes ?? '',
    marketing_consent: Boolean(c.marketing_consent),
    is_active: Boolean(c.is_active),
  };
}

const digitsOnly = (v, max) => v.replace(/\D/g, '').slice(0, max);

export default function CustomerForm({ customer, onClose, onSaved }) {
  const { t } = useTranslation();
  const isEdit = Boolean(customer);

  const [initial] = useState(() => toForm(customer));
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [existing, setExisting] = useState(null); // lookup la kedacha customer

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  const setField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const handleMobile = async (value) => {
    const v = digitsOnly(value, 10);
    setField('mobile', v);
    setExisting(null);
    if (!isEdit && v.length === 10) {
      try {
        const res = await lookupCustomer(v);
        setExisting(res.data.data);
      } catch {
        // lookup fail aana silent; save time la server check pannum
      }
    }
  };

  const handleClose = () => {
    if (saving) return;
    if (dirty && !window.confirm(t('customers.unsavedConfirm'))) return;
    onClose();
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t('customers.nameRequired');
    if (!/^\d{10}$/.test(form.mobile)) e.mobile = t('customers.mobileInvalid');
    if (form.alt_mobile && !/^\d{10}$/.test(form.alt_mobile)) e.alt_mobile = t('customers.mobileInvalid');
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = t('customers.emailInvalid');
    if (form.pincode && !/^\d{6}$/.test(form.pincode)) e.pincode = t('customers.pincodeInvalid');
    if (form.gstin && form.gstin.length !== 15) e.gstin = t('customers.gstinInvalid');
    if (form.credit_limit !== '' && Number(form.credit_limit) < 0) e.credit_limit = t('customers.creditInvalid');
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError('');

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const payload = {
      ...form,
      credit_limit:
        form.type === 'dealer' && form.credit_limit !== '' ? Number(form.credit_limit) : null,
    };

    setSaving(true);
    try {
      if (isEdit) await updateCustomer(customer.id, payload);
      else await createCustomer(payload);
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
        setServerError(err.response?.data?.message || t('customers.saveError'));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={handleClose} fullWidth maxWidth="md">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600 }}>
          {isEdit ? t('customers.edit') : t('customers.add')}
        </DialogTitle>

        <DialogContent>
          {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
          {existing && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {t('customers.alreadyExists', { name: existing.name })}
            </Alert>
          )}

          <Box
            sx={{
              display: 'grid', gap: 2, pt: 1,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            }}
          >
            <TextField
              label={`${t('customers.name')} *`} value={form.name} autoFocus
              onChange={(e) => setField('name', e.target.value)}
              error={Boolean(errors.name)} helperText={errors.name}
            />
            <TextField
              label={`${t('customers.mobile')} *`} value={form.mobile}
              onChange={(e) => handleMobile(e.target.value)}
              error={Boolean(errors.mobile)} helperText={errors.mobile}
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            />
            <TextField
              label={t('customers.altMobile')} value={form.alt_mobile}
              onChange={(e) => setField('alt_mobile', digitsOnly(e.target.value, 10))}
              error={Boolean(errors.alt_mobile)} helperText={errors.alt_mobile}
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            />
            <TextField
              label={t('customers.email')} value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              error={Boolean(errors.email)} helperText={errors.email}
            />
            <TextField
              select label={t('customers.type')} value={form.type}
              onChange={(e) => setField('type', e.target.value)}
              error={Boolean(errors.type)} helperText={errors.type}
            >
              {['retail', 'dealer', 'corporate'].map((x) => (
                <MenuItem key={x} value={x}>{t(`customers.types.${x}`)}</MenuItem>
              ))}
            </TextField>
            <TextField
              label={t('customers.gstin')} value={form.gstin}
              onChange={(e) => setField('gstin', e.target.value.toUpperCase().slice(0, 15))}
              error={Boolean(errors.gstin)} helperText={errors.gstin}
            />
            {form.type === 'dealer' && (
              <TextField
                label={t('customers.creditLimit')} type="number" value={form.credit_limit}
                onChange={(e) => setField('credit_limit', e.target.value)}
                error={Boolean(errors.credit_limit)}
                helperText={errors.credit_limit || t('customers.creditHelp')}
              />
            )}
            <TextField
              label={t('customers.dob')} type="date" value={form.dob}
              onChange={(e) => setField('dob', e.target.value)}
              error={Boolean(errors.dob)} helperText={errors.dob}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label={t('customers.city')} value={form.city}
              onChange={(e) => setField('city', e.target.value)}
              error={Boolean(errors.city)} helperText={errors.city}
            />
            <TextField
              label={t('customers.pincode')} value={form.pincode}
              onChange={(e) => setField('pincode', digitsOnly(e.target.value, 6))}
              error={Boolean(errors.pincode)} helperText={errors.pincode}
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            />
            <TextField
              label={t('customers.address')} value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              error={Boolean(errors.address)} helperText={errors.address}
              multiline minRows={2} sx={{ gridColumn: { sm: '1 / -1' } }}
            />
            <TextField
              label={t('customers.notes')} value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              error={Boolean(errors.notes)} helperText={errors.notes}
              multiline minRows={2} sx={{ gridColumn: { sm: '1 / -1' } }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.marketing_consent}
                  onChange={(e) => setField('marketing_consent', e.target.checked)}
                />
              }
              label={t('customers.marketing')}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(e) => setField('is_active', e.target.checked)}
                />
              }
              label={t('customers.active')}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleClose} disabled={saving} sx={{ minHeight: 42 }}>
            {t('customers.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={saving} sx={{ minHeight: 42 }}>
            {saving ? t('customers.saving') : t('customers.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}