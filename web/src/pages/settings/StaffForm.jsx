import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, ListItemText, MenuItem, Switch, TextField,
} from '@mui/material';
import { createStaff, updateStaff } from '../../api/staff';
import { useAuth } from '../../context/AuthContext';
import PasswordField from '../../components/PasswordField';

const emptyForm = {
  name: '', mobile: '', email: '', password: '', role_id: '',
  branch_ids: [], commission_pct: '0', is_active: true,
};

function toForm(staff) {
  if (!staff) return emptyForm;
  return {
    name: staff.name ?? '',
    mobile: staff.mobile ?? '',
    email: staff.email ?? '',
    password: '', // edit la blank, type pannina mattum maathum
    role_id: staff.role_id ?? '',
    branch_ids: staff.branches?.map((b) => b.id) ?? [],
    commission_pct: String(Number(staff.commission_pct ?? 0)),
    is_active: Boolean(staff.is_active),
  };
}

export default function StaffForm({ staff, roles, onClose, onSaved }) {
  const { t } = useTranslation();
  const { me } = useAuth();
  const isEdit = Boolean(staff);

  const [form, setForm] = useState(() => toForm(staff));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  const setField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t('staff.nameRequired');
    if (!/^\d{10}$/.test(form.mobile)) e.mobile = t('staff.mobileInvalid');
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = t('staff.emailInvalid');
    // Add la password kandippa, Edit la type pannina mattum check
    if ((!isEdit || form.password) && form.password.length < 8) e.password = t('staff.passwordShort');
    if (!form.role_id) e.role_id = t('staff.roleRequired');
    if (form.branch_ids.length === 0) e.branch_ids = t('staff.branchesRequired');
    const c = Number(form.commission_pct);
    if (form.commission_pct === '' || Number.isNaN(c) || c < 0 || c > 100) {
      e.commission_pct = t('staff.commissionInvalid');
    }
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError('');

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // API ku anuppura data: email blank na null, commission number, Edit la password blank na anuppa vendaam
    const payload = {
      name: form.name.trim(),
      mobile: form.mobile,
      email: form.email.trim() || null,
      role_id: form.role_id,
      branch_ids: form.branch_ids,
      commission_pct: Number(form.commission_pct),
      is_active: form.is_active,
    };
    if (form.password) payload.password = form.password;

    setSaving(true);
    try {
      if (isEdit) await updateStaff(staff.id, payload);
      else await createStaff(payload);
      onSaved();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (err.response?.status === 422 && apiErrors) {
        const mapped = {};
        Object.keys(apiErrors).forEach((k) => {
          // Laravel: "branch_ids.0" -> form la "branch_ids" field ku
          const field = k.startsWith('branch_ids') ? 'branch_ids' : k;
          mapped[field] = apiErrors[k][0];
        });
        setErrors(mapped);
      } else {
        // "The shop must keep at least one active Admin." maari server messages
        setServerError(err.response?.data?.message || t('staff.genericError'));
      }
    } finally {
      setSaving(false);
    }
  };

  const branchOptions = me.branches;

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600 }}>
          {isEdit ? t('staff.edit') : t('staff.add')}
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
              label={`${t('staff.name')} *`}
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              error={Boolean(errors.name)}
              helperText={errors.name}
              autoFocus
            />
            <TextField
              label={`${t('staff.mobile')} *`}
              value={form.mobile}
              onChange={(e) => setField('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
              error={Boolean(errors.mobile)}
              helperText={errors.mobile}
            />
            <TextField
              label={t('staff.email')}
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              error={Boolean(errors.email)}
              helperText={errors.email}
            />
            <PasswordField
              label={isEdit ? t('staff.password') : `${t('staff.password')} *`}
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              error={Boolean(errors.password)}
              helperText={errors.password || (isEdit ? t('staff.passwordHint') : '')}
              autoComplete="new-password"
            />
            <TextField
              select
              label={`${t('staff.role')} *`}
              value={form.role_id}
              onChange={(e) => setField('role_id', e.target.value)}
              error={Boolean(errors.role_id)}
              helperText={errors.role_id}
            >
              {roles.map((r) => (
                <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              label={t('staff.commission')}
              type="number"
              value={form.commission_pct}
              onChange={(e) => setField('commission_pct', e.target.value)}
              error={Boolean(errors.commission_pct)}
              helperText={errors.commission_pct}
              slotProps={{ htmlInput: { min: 0, max: 100, step: 0.5 } }}
            />

            {/* Multi-select: value oru array */}
            <TextField
              select
              label={`${t('staff.branches')} *`}
              value={form.branch_ids}
              onChange={(e) => {
                const v = e.target.value;
                setField('branch_ids', typeof v === 'string' ? v.split(',').map(Number) : v);
              }}
              error={Boolean(errors.branch_ids)}
              helperText={errors.branch_ids}
              sx={{ gridColumn: { sm: '1 / -1' } }}
              slotProps={{
                select: {
                  multiple: true,
                  renderValue: (selected) => (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {selected.map((id) => (
                        <Chip key={id} size="small" label={branchOptions.find((b) => b.id === id)?.name ?? id} />
                      ))}
                    </Box>
                  ),
                },
              }}
            >
              {branchOptions.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  <Checkbox checked={form.branch_ids.includes(b.id)} />
                  <ListItemText primary={`${b.name} (${b.code})`} />
                </MenuItem>
              ))}
            </TextField>

            <FormControlLabel
              control={
                <Switch checked={form.is_active} onChange={(e) => setField('is_active', e.target.checked)} />
              }
              label={t('staff.active')}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={saving} sx={{ minHeight: 42 }}>
            {t('staff.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={saving} sx={{ minHeight: 42 }}>
            {saving ? t('staff.saving') : t('staff.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}