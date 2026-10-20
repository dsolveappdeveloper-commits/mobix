import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, IconButton, InputAdornment, MenuItem, Paper, Snackbar,
  Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow,
  TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { deleteStaff, listStaff } from '../../api/staff';
import { listRoles } from '../../api/roles';
import { useAuth } from '../../context/AuthContext';
import useDebounce from '../../hooks/useDebounce';
import StaffForm from './StaffForm';

export default function Staff() {
  const { t } = useTranslation();
  const { can } = useAuth();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [roles, setRoles] = useState([]);

  // filters
  const [search, setSearch] = useState('');
  const q = useDebounce(search, 500);
  const [roleId, setRoleId] = useState('');
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(25);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [snack, setSnack] = useState('');
  const [formStaff, setFormStaff] = useState(undefined);

  // Role dropdown ku roles oru thadavai load pannum
  useEffect(() => {
    listRoles()
      .then((res) => setRoles(res.data))
      .catch(() => {});
  }, []);

  // q / roleId / page / perPage / reloadKey if any changes data return
  useEffect(() => {
    let ignore = false;

    const params = { page: page + 1, per_page: perPage };
    if (q.trim()) params.q = q.trim();
    if (roleId) params.role_id = roleId;

    listStaff(params)
      .then((res) => {
        if (ignore) return;
        setRows(res.data.data);
        setTotal(res.data.total);
      })
      .catch(() => {
        if (!ignore) setError(t('staff.loadError'));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [q, roleId, page, perPage, reloadKey, t]);

  const reload = () => {
    setLoading(true);
    setError('');
    setReloadKey((k) => k + 1);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(0);
    setLoading(true);
  };

  const handleRole = (e) => {
    setRoleId(e.target.value);
    setPage(0);
    setLoading(true);
  };

  const handlePage = (_, newPage) => {
    setPage(newPage);
    setLoading(true);
  };

  const handlePerPage = (e) => {
    setPerPage(Number(e.target.value));
    setPage(0);
    setLoading(true);
  };

  const handleSaved = () => {
    setFormStaff(undefined);
    setSnack(t('staff.saved'));
    reload();
  }

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await deleteStaff(deleting.id);
      setSnack(t('staff.deleted'));
      reload();
    } catch (err) {
      // "You cannot delete yourself" maari server messages
      setSnack(err.response?.data?.message || t('staff.genericError'));
    } finally {
      setDeleting(null);
      setDeleteBusy(false);
    }
  };

  if (error) {
    return (
      <Alert
        severity="error"
        action={<Button color="inherit" size="small" onClick={reload}>{t('staff.retry')}</Button>}
      >
        {error}
      </Alert>
    );
  }

  return (
    <Paper variant="outlined" sx={{ borderColor: 'divider' }}>
      {/* Toolbar: search + role filter + add */}
      <Box sx={{ display: 'flex', gap: 2, p: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          value={search}
          onChange={handleSearch}
          placeholder={t('staff.searchPlaceholder')}
          sx={{ minWidth: { xs: '100%', sm: 280 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          select
          size="small"
          value={roleId}
          onChange={handleRole}
          sx={{ minWidth: 180 }}
          slotProps={{ select: { displayEmpty: true } }}
        >
          <MenuItem value="">{t('staff.allRoles')}</MenuItem>
          {roles.map((r) => (
            <MenuItem key={r.id} value={String(r.id)}>{r.name}</MenuItem>
          ))}
        </TextField>

        <Box sx={{ flexGrow: 1 }} />

        {can('settings', 'create') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormStaff(null)}
            sx={{ minHeight: 42 }}
          >
            {t('staff.add')}
          </Button>
        )}
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F5F9FF' }}>
              <TableCell>{t('staff.name')}</TableCell>
              <TableCell>{t('staff.role')}</TableCell>
              <TableCell>{t('staff.branches')}</TableCell>
              <TableCell>{t('staff.commission')}</TableCell>
              <TableCell>{t('staff.status')}</TableCell>
              <TableCell align="right">{t('staff.actions')}</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            )}

            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">{t('staff.empty')}</Typography>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              rows.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>{s.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{s.mobile}</Typography>
                  </TableCell>
                  <TableCell>{s.role?.name}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {s.branches?.map((b) => (
                        <Chip key={b.id} size="small" label={b.code} />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>{Number(s.commission_pct)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={s.is_active ? t('staff.active') : t('staff.inactive')}
                      color={s.is_active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {can('settings', 'edit') && (
                      <Tooltip title={t('staff.edit')}>
                        <IconButton onClick={() => setFormStaff(s)}>
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {can('settings', 'delete') && (
                      <Tooltip title={t('staff.delete')}>
                        <IconButton color="error" onClick={() => setDeleting(s)}>
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

      {formStaff !== undefined && (
        <StaffForm
          key={formStaff ? formStaff.id : 'new'}
          staff={formStaff}
          roles={roles}
          onClose={() => setFormStaff(undefined)}
          onSaved={handleSaved}
        />
      )}

      <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)}>
        <DialogTitle>{t('staff.deleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('staff.deleteConfirm', { name: deleting?.name })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleting(null)} disabled={deleteBusy}>
            {t('staff.cancel')}
          </Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleteBusy}>
            {t('staff.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={3000}
        onClose={() => setSnack('')}
        message={snack}
      />
    </Paper>
  );
}