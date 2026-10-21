import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Box, Button, Chip, CircularProgress, FormControlLabel, MenuItem, Paper,
  Snackbar, Switch, TextField, Typography,
} from '@mui/material';
import { getSettings, updateSettings } from '../../api/settings';
import useFetch from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';

const PAPERS = ['A4', 'A5', '80mm', '58mm'];
const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(2000, i, 1).toLocaleString('en', { month: 'long' }),
}));

// key = API setting key (DefaultSettings.php oda same). Pudhu setting vandha inge oru line add pannina podhum.
const SECTIONS = [
  {
    id: 'job',
    fields: [
      { key: 'job.default_promised_days', type: 'number', min: 0, max: 30 },
      { key: 'job.default_warranty_days', type: 'number', min: 0, max: 3650 },
      { key: 'job.terms', type: 'text', multiline: true },
    ],
  },
  {
    id: 'tax',
    fields: [
      { key: 'tax.gst_inclusive', type: 'switch' },
      { key: 'tax.default_labour_gst', type: 'number', min: 0, max: 100 },
      { key: 'tax.labour_sac', type: 'text' },
      { key: 'tax.round_off', type: 'switch' },
      { key: 'tax.financial_year_start', type: 'month' },
      { key: 'tax.upi_id', type: 'text' },
      { key: 'tax.invoice_footer', type: 'text', multiline: true },
    ],
  },
  {
    id: 'inventory',
    fields: [
      { key: 'inventory.allow_negative_stock', type: 'switch' },
      { key: 'inventory.low_stock_alert_time', type: 'time' },
    ],
  },
  {
    id: 'discount',
    fields: [{ key: 'discount.front_desk_max_pct', type: 'number', min: 0, max: 100 }],
  },
  {
    id: 'notify',
    fields: [
      { key: 'notify.quiet_start', type: 'time' },
      { key: 'notify.quiet_end', type: 'time' },
      { key: 'notify.tracking_base_url', type: 'text' },
    ],
  },
  {
    id: 'print',
    fields: [
      { key: 'print.invoice_paper', type: 'select', options: PAPERS },
      { key: 'print.job_sheet_paper', type: 'select', options: PAPERS },
      { key: 'print.label_paper', type: 'select', options: ['50x25'] },
    ],
  },
];

const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields);

export default function Preferences() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch(getSettings);

  if (loading) return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>;

  if (error) {
    return (
      <Alert
        severity="error"
        action={<Button color="inherit" size="small" onClick={reload}>{t('prefs.retry')}</Button>}
      >
        {t('prefs.loadError')}
      </Alert>
    );
  }

  // Data vandha appuram dhaan form create aagum, adhanaala initial values correct
  return <PreferencesForm settings={data} />;
}

function PreferencesForm({ settings }) {
  const { t } = useTranslation();
  const { can } = useAuth();
  const editable = can('settings', 'edit');

  const [saved, setSaved] = useState(settings); // last saved values
  const [values, setValues] = useState(settings); // screen la irukkura values
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState('');

  const dirty = ALL_FIELDS.some((f) => String(values[f.key]) !== String(saved[f.key]));

  const setValue = (key, value) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const save = async () => {
    // Maathinadhu mattum anuppurom
    const payload = {};
    ALL_FIELDS.forEach((f) => {
      if (String(values[f.key]) === String(saved[f.key])) return;
      const v = values[f.key];
      payload[f.key] = f.type === 'number' || f.type === 'month' ? (v === '' ? '' : Number(v)) : v;
    });

    setSaving(true);
    try {
      const res = await updateSettings({ settings: payload });
      setSaved(res.data);
      setValues(res.data);
      setErrors({});
      setSnack(t('prefs.saved'));
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (err.response?.status === 422 && apiErrors) {
        setErrors(Object.fromEntries(Object.entries(apiErrors).map(([k, v]) => [k, v[0]])));
      } else {
        setSnack(err.response?.data?.message || t('prefs.genericError'));
      }
    } finally {
      setSaving(false);
    }
  };

  const renderField = (f) => {
    // Key la dot irukkarathaala i18n nested path: prefs.fields.job.default_warranty_days
    const label = t(`prefs.fields.${f.key}`);
    const helper = errors[f.key] || t(`prefs.help.${f.key}`, { defaultValue: '' });

    if (f.type === 'switch') {
      return (
        <FormControlLabel
          key={f.key}
          label={label}
          control={
            <Switch
              checked={Boolean(values[f.key])}
              disabled={!editable}
              onChange={(e) => setValue(f.key, e.target.checked)}
            />
          }
        />
      );
    }

    const common = {
      key: f.key,
      label,
      value: values[f.key] ?? '',
      onChange: (e) => setValue(f.key, e.target.value),
      error: Boolean(errors[f.key]),
      helperText: helper,
      disabled: !editable,
    };

    if (f.type === 'number') {
      return <TextField {...common} type="number" slotProps={{ htmlInput: { min: f.min, max: f.max } }} />;
    }

    if (f.type === 'time') {
      return <TextField {...common} type="time" slotProps={{ inputLabel: { shrink: true } }} />;
    }

    if (f.type === 'month') {
      return (
        <TextField {...common} select>
          {MONTHS.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
        </TextField>
      );
    }

    if (f.type === 'select') {
      return (
        <TextField {...common} select>
          {f.options.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
        </TextField>
      );
    }

    return (
      <TextField
        {...common}
        multiline={f.multiline}
        minRows={f.multiline ? 2 : undefined}
        sx={f.multiline ? { gridColumn: { sm: '1 / -1' } } : undefined}
      />
    );
  };

  return (
    <Box sx={{ maxWidth: 900 }}>
      {editable && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5, mb: 2 }}>
          {dirty && <Chip size="small" color="warning" label={t('prefs.unsaved')} />}
          <Button variant="contained" onClick={save} disabled={!dirty || saving} sx={{ minHeight: 42 }}>
            {saving ? t('prefs.saving') : t('prefs.save')}
          </Button>
        </Box>
      )}

      <Box sx={{ display: 'grid', gap: 2 }}>
        {SECTIONS.map((s) => (
          <Paper key={s.id} variant="outlined" sx={{ borderColor: 'divider', p: { xs: 2, md: 3 } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>{t(`prefs.sections.${s.id}`)}</Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, alignItems: 'start' }}>
              {s.fields.map(renderField)}
            </Box>
          </Paper>
        ))}
      </Box>

      <Snackbar open={Boolean(snack)} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}