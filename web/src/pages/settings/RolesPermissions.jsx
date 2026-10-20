import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, IconButton, List, ListItemButton,
  ListItemText, MenuItem, Paper, Snackbar, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import { createRole, deleteRole, listRoles, renameRole, savePermissions } from '../../api/roles';
import { useAuth } from '../../context/AuthContext';

const ACTIONS = ['view', 'create', 'edit', 'delete', 'export'];
const MODULES = [
  'dashboard', 'jobs', 'customers', 'sales', 'inventory',
  'billing', 'expenses', 'reports', 'settings',
];

export default function RolesPermissions() {
  const { t } = useTranslation();
  const { me, can, refreshMe } = useAuth();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedId, setSelectedId] = useState(null);
  // Save pannaadha maatrangal: { roleId: matrix }. Role maathina kooda maatrangal irukkum.
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState('');

  // null = closed, { role: null } = Add, { role } = Rename
  const [roleDialog, setRoleDialog] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    let ignore = false;

    listRoles()
      .then((res) => {
        if (!ignore) setRoles(res.data);
      })
      .catch(() => {
        if (!ignore) setError(t('roles.loadError'));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [reloadKey, t]);

  const reload = () => setReloadKey((k) => k + 1);

  // State la store pannama, ippo irukkura values la irundhu calculate pannurom (derived values)
  const selected = roles.find((r) => r.id === selectedId) ?? roles[0];
  const matrix = selected ? (drafts[selected.id] ?? selected.permissions) : {};
  const dirty = selected ? Boolean(drafts[selected.id]) : false;
  const locked = Boolean(selected?.is_system && selected?.name === 'Admin') || !can('settings', 'edit');

  const toggle = (module, action, checked) => {
    const row = { ...matrix[module], [action]: checked };

    // View illama vera permission irukka koodaadhu
    if (action === 'view' && !checked) ACTIONS.forEach((a) => { row[a] = false; });
    if (action !== 'view' && checked) row.view = true;

    setDrafts((d) => ({ ...d, [selected.id]: { ...matrix, [module]: row } }));
  };

  const save = async () => {
    const payload = MODULES.map((m) => ({
      module: m,
      ...Object.fromEntries(ACTIONS.map((a) => [a, Boolean(matrix[m]?.[a])])),
    }));

    setSaving(true);
    try {
      await savePermissions(selected.id, payload);
      setDrafts((d) => {
        const next = { ...d };
        delete next[selected.id];
        return next;
      });
      setSnack(t('roles.saved'));
      reload();
      if (selected.id === me.role.id) refreshMe(); // en own role maathina sidebar update aaganum
    } catch (err) {
      setSnack(err.response?.data?.message || t('roles.genericError'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteRole(deleting.id);
      if (deleting.id === selected?.id) setSelectedId(null);
      setSnack(t('roles.roleDeleted'));
      reload();
    } catch (err) {
      setSnack(err.response?.data?.message || t('roles.genericError'));
    } finally {
      setDeleting(null);
    }
  };

  if (error) {
    return (
      <Alert
        severity="error"
        action={<Button color="inherit" size="small" onClick={() => { setError(''); setLoading(true); reload(); }}>{t('roles.retry')}</Button>}
      >
        {error}
      </Alert>
    );
  }

  if (loading) {
    return <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '260px 1fr' }, alignItems: 'start' }}>
      {/* Left: roles list */}
      <Paper variant="outlined" sx={{ borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, pb: 1 }}>
          <Typography sx={{ fontWeight: 600 }}>{t('roles.list')}</Typography>
          {can('settings', 'create') && (
            <Button size="small" startIcon={<AddIcon />} onClick={() => setRoleDialog({ role: null })}>
              {t('roles.add')}
            </Button>
          )}
        </Box>
        <List sx={{ pt: 0 }}>
          {roles.map((r) => (
            <ListItemButton key={r.id} selected={r.id === selected?.id} onClick={() => setSelectedId(r.id)}>
              <ListItemText primary={r.name} />
              {drafts[r.id] && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main', mr: 1 }} />}
              {r.is_system && <Chip size="small" label={t('roles.system')} />}
            </ListItemButton>
          ))}
        </List>
      </Paper>

      {/* Right: permission matrix */}
      {selected && (
        <Paper variant="outlined" sx={{ borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>{selected.name}</Typography>

            {!selected.is_system && can('settings', 'edit') && (
              <IconButton onClick={() => setRoleDialog({ role: selected })} aria-label={t('roles.rename')}>
                <EditOutlined fontSize="small" />
              </IconButton>
            )}
            {!selected.is_system && can('settings', 'delete') && (
              <IconButton color="error" onClick={() => setDeleting(selected)} aria-label={t('roles.delete')}>
                <DeleteOutlined fontSize="small" />
              </IconButton>
            )}
            {dirty && <Chip size="small" color="warning" label={t('roles.unsaved')} />}
            {!locked && (
              <Button variant="contained" onClick={save} disabled={!dirty || saving} sx={{ minHeight: 40 }}>
                {saving ? t('roles.saving') : t('roles.save')}
              </Button>
            )}
          </Box>

          {selected.is_system && selected.name === 'Admin' && (
            <Alert severity="info" sx={{ mx: 2, mb: 2 }}>{t('roles.adminLocked')}</Alert>
          )}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F5F9FF' }}>
                  <TableCell>{t('roles.module')}</TableCell>
                  {ACTIONS.map((a) => (
                    <TableCell key={a} align="center">{t(`roles.perm.${a}`)}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {MODULES.map((m) => (
                  <TableRow key={m} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{t(`menu.${m}`)}</TableCell>
                    {ACTIONS.map((a) => (
                      <TableCell key={a} align="center" padding="checkbox">
                        <Checkbox
                          checked={Boolean(matrix[m]?.[a])}
                          disabled={locked}
                          onChange={(e) => toggle(m, a, e.target.checked)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {roleDialog && (
        <RoleDialog
          key={roleDialog.role?.id ?? 'new'}
          role={roleDialog.role}
          roles={roles}
          onClose={() => setRoleDialog(null)}
          onDone={(saved) => {
            setRoleDialog(null);
            if (saved?.id) setSelectedId(saved.id);
            setSnack(t('roles.roleSaved'));
            reload();
            refreshMe();
          }}
        />
      )}

      <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)}>
        <DialogTitle>{t('roles.deleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('roles.deleteConfirm', { name: deleting?.name })}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleting(null)}>{t('roles.cancel')}</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>{t('roles.delete')}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(snack)} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
}

// Add / Rename role dialog (chinna component, same file la)
function RoleDialog({ role, roles, onClose, onDone }) {
  const { t } = useTranslation();
  const isRename = Boolean(role);

  const [name, setName] = useState(role?.name ?? '');
  const [copyFrom, setCopyFrom] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(t('roles.nameRequired'));
      return;
    }

    setSaving(true);
    try {
      const res = isRename
        ? await renameRole(role.id, { name: name.trim() })
        : await createRole({ name: name.trim(), copy_from: copyFrom || null });
      onDone(res.data);
    } catch (err) {
      setError(err.response?.data?.errors?.name?.[0] || err.response?.data?.message || t('roles.genericError'));
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <Box component="form" onSubmit={submit} noValidate>
        <DialogTitle sx={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600 }}>
          {isRename ? t('roles.rename') : t('roles.add')}
        </DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
          <TextField
            label={`${t('roles.name')} *`}
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            error={Boolean(error)}
            helperText={error}
            autoFocus
          />
          {!isRename && (
            <TextField
              select
              label={t('roles.copyFrom')}
              value={copyFrom}
              onChange={(e) => setCopyFrom(e.target.value)}
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">{t('roles.copyNone')}</MenuItem>
              {roles.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
            </TextField>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={saving}>{t('roles.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={saving}>{t('roles.save')}</Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}