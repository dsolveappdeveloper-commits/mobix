import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, Switch, TextField,
} from '@mui/material';
import { createBranch, updateBranch } from '../../api/branches';

const emptyForm = {
  name: '', code: '', phone: '', address: '', gstin: '',
  invoice_prefix: '', opening_time: '', is_active: true,
};

// branch irundha Edit (values fill aagum), null na Add (empty form)
function toForm(branch) {
  if (!branch) return emptyForm;
  return {
    name: branch.name ?? '',
    code: branch.code ?? '',
    phone: branch.phone ?? '',
    address: branch.address ?? '',
    gstin: branch.gstin ?? '',
    invoice_prefix: branch.invoice_prefix ?? '',
    opening_time: branch.opening_time ? branch.opening_time.slice(0, 5) : '',
    is_active: Boolean(branch.is_active),
  };
}

export default function BranchForm({ branch, onClose, onSaved }) {
  const { t } = useTranslation();
  const isEdit = Boolean(branch);

  const [form, setForm] = useState(() => toForm(branch));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  // oru field maathumbodhu: form object copy pannitu andha key mattum maathurom
  const setField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t('branches.nameRequired');
    if (!/^[A-Za-z]{3}$/.test(form.code)) e.code = t('branches.codeInvalid');
    if (form.gstin && form.gstin.length !== 15) e.gstin = t('branches.gstinInvalid');
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError('');

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      if (isEdit) await updateBranch(branch.id, form);
      else await createBranch(form);
      onSaved();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (err.response?.status === 422 && apiErrors) {
        // Laravel: { errors: { code: ['The code has already been taken.'] } }
        const mapped = {};
        Object.keys(apiErrors).forEach((k) => {
          mapped[k] = apiErrors[k][0];
        });
        setErrors(mapped);
      } else {
        setServerError(t('branches.saveError'));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600 }}>
          {isEdit ? t('branches.edit') : t('branches.add')}
        </DialogTitle>

        <DialogContent>
          {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              pt: 1,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            }}
          >
            <TextField
              label={`${t('branches.name')} *`}
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              error={Boolean(errors.name)}
              helperText={errors.name}
              autoFocus
            />
            <TextField
              label={`${t('branches.code')} *`}
              value={form.code}
              onChange={(e) => setField('code', e.target.value.toUpperCase().slice(0, 3))}
              error={Boolean(errors.code)}
              helperText={errors.code || t('branches.codeHelp')}
            />
            <TextField
              label={t('branches.phone')}
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              error={Boolean(errors.phone)}
              helperText={errors.phone}
            />
            <TextField
              label={t('branches.opening')}
              type="time"
              value={form.opening_time}
              onChange={(e) => setField('opening_time', e.target.value)}
              error={Boolean(errors.opening_time)}
              helperText={errors.opening_time}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label={t('branches.gstin')}
              value={form.gstin}
              onChange={(e) => setField('gstin', e.target.value.toUpperCase().slice(0, 15))}
              error={Boolean(errors.gstin)}
              helperText={errors.gstin}
            />
            <TextField
              label={t('branches.invoicePrefix')}
              value={form.invoice_prefix}
              onChange={(e) => setField('invoice_prefix', e.target.value)}
              error={Boolean(errors.invoice_prefix)}
              helperText={errors.invoice_prefix}
            />
            <TextField
              label={t('branches.address')}
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              error={Boolean(errors.address)}
              helperText={errors.address}
              multiline
              minRows={2}
              sx={{ gridColumn: { sm: '1 / -1' } }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(e) => setField('is_active', e.target.checked)}
                />
              }
              label={t('branches.active')}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={saving} sx={{ minHeight: 42 }}>
            {t('branches.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={saving} sx={{ minHeight: 42 }}>
            {saving ? t('branches.saving') : t('branches.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}