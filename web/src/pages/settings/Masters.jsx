import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, FormControlLabel, IconButton, MenuItem, Paper,
  Snackbar, Switch, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, Tabs, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import {
  createBrand, createDeviceType, createModel,
  deleteBrand, deleteDeviceType, deleteModel,
  listBrands, listDeviceTypes, listModels,
  updateBrand, updateDeviceType, updateModel,
} from '../../api/masters';
import { useAuth } from '../../context/AuthContext';

const statusCol = {
  key: 'status',
  labelKey: 'masters.status',
  render: (r, t) => (
    <Chip
      size="small"
      variant="outlined"
      color={r.is_active ? 'success' : 'default'}
      label={r.is_active ? t('masters.active') : t('masters.inactive')}
    />
  ),
};

const nameCol = { key: 'name', labelKey: 'masters.name', render: (r) => r.name, bold: true };

const nameField = { name: 'name', labelKey: 'masters.name', type: 'text', required: true, default: '' };
const activeField = { name: 'is_active', labelKey: 'masters.active', type: 'switch', default: true };

// Pudhu master vandha inge oru config add pannina podhum
const CONFIGS = [
  {
    id: 'deviceTypes',
    api: { list: listDeviceTypes, create: createDeviceType, update: updateDeviceType, remove: deleteDeviceType },
    columns: [
      nameCol,
      {
        key: 'tracking',
        labelKey: 'masters.tracking',
        render: (r, t) => (r.requires_imei ? 'IMEI' : t('masters.serial')),
      },
      { key: 'sort', labelKey: 'masters.sortOrder', render: (r) => r.sort_order },
      statusCol,
    ],
    fields: [
      nameField,
      { name: 'requires_imei', labelKey: 'masters.requiresImei', hintKey: 'masters.requiresImeiHint', type: 'switch', default: true },
      { name: 'sort_order', labelKey: 'masters.sortOrder', type: 'number', default: 0 },
      activeField,
    ],
  },
  {
    id: 'brands',
    api: { list: listBrands, create: createBrand, update: updateBrand, remove: deleteBrand },
    columns: [nameCol, statusCol],
    fields: [nameField, activeField],
  },
  {
    id: 'models',
    api: { list: listModels, create: createModel, update: updateModel, remove: deleteModel },
    columns: [
      nameCol,
      { key: 'brand', labelKey: 'masters.brand', render: (r) => r.brand?.name ?? '-' },
      { key: 'type', labelKey: 'masters.deviceType', render: (r) => r.device_type?.name ?? '-' },
      statusCol,
    ],
    fields: [
      { name: 'brand_id', labelKey: 'masters.brand', type: 'select', load: listBrands, required: true, default: '' },
      { name: 'device_type_id', labelKey: 'masters.deviceType', type: 'select', load: listDeviceTypes, required: true, default: '' },
      nameField,
      activeField,
    ],
  },
];

export default function Masters() {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        {CONFIGS.map((c) => <Tab key={c.id} label={t(`masters.tabs.${c.id}`)} />)}
      </Tabs>
      {/* key: tab maaralaa state (page, search) reset aagum */}
      <MasterTable key={CONFIGS[tab].id} cfg={CONFIGS[tab]} />
    </Box>
  );
}

function MasterTable({ cfg }) {
  const { t } = useTranslation();
  const { can } = useAuth();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState(''); // type panna text
  const [q, setQ] = useState(''); // Enter appuram apply aanadhu
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [formRecord, setFormRecord] = useState(undefined); // undefined=closed, null=add, object=edit
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [snack, setSnack] = useState('');

  useEffect(() => {
    let ignore = false;

    cfg.api
      .list({ page: page + 1, per_page: perPage, q: q || undefined })
      .then((res) => {
        if (ignore) return;
        setRows(res.data.data);
        setTotal(res.data.total);
      })
      .catch(() => {
        if (!ignore) setError(t('masters.loadError'));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [cfg, page, perPage, q, reloadKey, t]);

  const reload = () => {
    setLoading(true);
    setError('');
    setReloadKey((k) => k + 1);
  };

  const applySearch = () => {
    if (search.trim() === q) return;
    setLoading(true);
    setError('');
    setPage(0);
    setQ(search.trim());
  };

  const handlePage = (_, newPage) => {
    setLoading(true);
    setError('');
    setPage(newPage);
  };

  const handlePerPage = (e) => {
    setLoading(true);
    setError('');
    setPerPage(Number(e.target.value));
    setPage(0);
  };

  const handleSaved = () => {
    setFormRecord(undefined);
    setSnack(t('masters.saved'));
    reload();
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await cfg.api.remove(deleting.id);
      setDeleting(null);
      setSnack(t('masters.deleted'));
      reload();
    } catch (err) {
      setDeleting(null);
      // Server message: "This brand has models. Delete them first."
      setSnack(err.response?.data?.message || t('masters.genericError'));
    } finally {
      setDeleteBusy(false);
    }
  };

  if (error) {
    return (
      <Alert
        severity="error"
        action={<Button color="inherit" size="small" onClick={reload}>{t('masters.retry')}</Button>}
      >
        {error}
      </Alert>
    );
  }

  const colCount = cfg.columns.length + 1;

  return (
    <Paper variant="outlined" sx={{ borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, p: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applySearch()}
          onBlur={applySearch}
          placeholder={t('masters.searchHint')}
          sx={{ minWidth: { xs: '100%', sm: 280 } }}
        />
        {can('settings', 'create') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormRecord(null)}
            sx={{ minHeight: 42 }}
          >
            {t(`masters.addTitle.${cfg.id}`)}
          </Button>
        )}
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F5F9FF' }}>
              {cfg.columns.map((c) => <TableCell key={c.key}>{t(c.labelKey)}</TableCell>)}
              <TableCell align="right">{t('masters.actions')}</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={colCount} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            )}

            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={colCount} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">{t('masters.empty')}</Typography>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              rows.map((r) => (
                <TableRow key={r.id} hover>
                  {cfg.columns.map((c) => (
                    <TableCell key={c.key} sx={c.bold ? { fontWeight: 600 } : undefined}>
                      {c.render(r, t)}
                    </TableCell>
                  ))}
                  <TableCell align="right">
                    {can('settings', 'edit') && (
                      <Tooltip title={t('masters.edit')}>
                        <IconButton onClick={() => setFormRecord(r)}>
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {can('settings', 'delete') && (
                      <Tooltip title={t('masters.delete')}>
                        <IconButton color="error" onClick={() => setDeleting(r)}>
                          <DeleteOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={handlePage}
        rowsPerPage={perPage}
        onRowsPerPageChange={handlePerPage}
        rowsPerPageOptions={[25, 50, 100]}
      />

      {formRecord !== undefined && (
        <MasterForm
          key={formRecord ? formRecord.id : 'new'}
          cfg={cfg}
          record={formRecord}
          onClose={() => setFormRecord(undefined)}
          onSaved={handleSaved}
        />
      )}

      <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)}>
        <DialogTitle>{t('masters.deleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('masters.deleteConfirm', { name: deleting?.name })}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleting(null)} disabled={deleteBusy}>{t('masters.cancel')}</Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleteBusy}>
            {t('masters.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(snack)} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </Paper>
  );
}

function MasterForm({ cfg, record, onClose, onSaved }) {
  const { t } = useTranslation();

  const [form, setForm] = useState(() =>
    Object.fromEntries(
      cfg.fields.map((f) => {
        const v = record ? record[f.name] : f.default;
        return [f.name, f.type === 'switch' ? Boolean(v) : (v ?? '')];
      }),
    ),
  );
  const [options, setOptions] = useState({}); // select fields: { brand_id: [...] }
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  // Select dropdown options load (brand, device type)
  useEffect(() => {
    let ignore = false;
    cfg.fields
      .filter((f) => f.type === 'select')
      .forEach((f) => {
        f.load({ per_page: 500 }).then((res) => {
          if (!ignore) setOptions((o) => ({ ...o, [f.name]: res.data.data }));
        });
      });
    return () => {
      ignore = true;
    };
  }, [cfg]);

  const setField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const validate = () => {
    const e = {};
    cfg.fields.forEach((f) => {
      if (f.required && String(form[f.name]).trim() === '') e[f.name] = t('masters.required');
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = () => {
    const p = {};
    cfg.fields.forEach((f) => {
      const v = form[f.name];
      if (f.type === 'text') p[f.name] = v.trim();
      else if (f.type === 'number' || f.type === 'select') p[f.name] = v === '' ? null : Number(v);
      else p[f.name] = v;
    });
    return p;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setFormError('');
    if (!validate()) return;

    setBusy(true);
    try {
      const payload = buildPayload();
      if (record) await cfg.api.update(record.id, payload);
      else await cfg.api.create(payload);
      onSaved();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (err.response?.status === 422 && apiErrors) {
        setErrors(Object.fromEntries(Object.entries(apiErrors).map(([k, v]) => [k, v[0]])));
      } else {
        setFormError(err.response?.data?.message || t('masters.genericError'));
      }
    } finally {
      setBusy(false);
    }
  };

  const renderField = (f) => {
    const label = `${t(f.labelKey)}${f.required ? ' *' : ''}`;

    if (f.type === 'switch') {
      return (
        <Box key={f.name}>
          <FormControlLabel
            label={label}
            control={<Switch checked={form[f.name]} onChange={(e) => setField(f.name, e.target.checked)} />}
          />
          {f.hintKey && <Typography variant="caption" color="text.secondary" display="block">{t(f.hintKey)}</Typography>}
        </Box>
      );
    }

    const common = {
      key: f.name,
      label,
      value: form[f.name],
      onChange: (e) => setField(f.name, e.target.value),
      error: Boolean(errors[f.name]),
      helperText: errors[f.name],
    };

    if (f.type === 'select') {
      return (
        <TextField {...common} select>
          {(options[f.name] ?? []).map((o) => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
        </TextField>
      );
    }

    return <TextField {...common} type={f.type === 'number' ? 'number' : 'text'} />;
  };

  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="xs">
      <Box component="form" onSubmit={submit} noValidate>
        <DialogTitle>{t(`masters.${record ? 'editTitle' : 'addTitle'}.${cfg.id}`)}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          {cfg.fields.map(renderField)}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={busy}>{t('masters.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={busy}>
            {busy ? t('masters.saving') : t('masters.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}