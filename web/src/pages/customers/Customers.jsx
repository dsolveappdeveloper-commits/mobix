import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, IconButton, InputAdornment, MenuItem, Paper, Snackbar,
  Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow,
  TableSortLabel, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import { deleteCustomer, listCustomers } from '../../api/customers';
import { useAuth } from '../../context/AuthContext';
import useDebounce from '../../hooks/useDebounce';
import CustomerForm from './CustomerForm';

const TYPES = ['retail', 'dealer', 'corporate'];

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

export default function Customers() {
  const { t } = useTranslation();
  const { can } = useAuth();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState('name');
  const [dir, setDir] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [formCustomer, setFormCustomer] = useState(undefined); // undefined = closed, null = add
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [snack, setSnack] = useState('');

  const q = useDebounce(search, 500);

  useEffect(() => {
    let ignore = false;

    const params = { page: page + 1, per_page: perPage, sort, dir };
    if (q.trim()) params.q = q.trim();
    if (type) params.type = type;

    listCustomers(params)
      .then((res) => {
        if (ignore) return;
        setRows(res.data.data);
        setTotal(res.data.total);
      })
      .catch(() => {
        if (!ignore) setError(t('customers.loadError'));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [page, perPage, q, type, sort, dir, reloadKey, t]);

  const reload = () => {
    setLoading(true);
    setError('');
    setReloadKey((k) => k + 1);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleType = (e) => {
    setLoading(true);
    setType(e.target.value);
    setPage(0);
  };

  const handleSort = (field) => {
    setLoading(true);
    if (sort === field) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSort(field);
      setDir('asc');
    }
    setPage(0);
  };

  const handlePage = (_, newPage) => {
    setLoading(true);
    setPage(newPage);
  };

  const handlePerPage = (e) => {
    setLoading(true);
    setPerPage(Number(e.target.value));
    setPage(0);
  };

  const handleSaved = () => {
    setFormCustomer(undefined);
    setSnack(t('customers.saved'));
    reload();
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await deleteCustomer(deleting.id);
      setDeleting(null);
      setSnack(t('customers.deleted'));
      reload();
    } catch (err) {
      setDeleting(null);
      setSnack(err.response?.data?.message || t('customers.genericError'));
    } finally {
      setDeleteBusy(false);
    }
  };

  // Technician ku API id + name mattum anuppum
  const nameOnly = rows.length > 0 && rows[0].mobile === undefined;
  const colCount = nameOnly ? 1 : 7;
  const showActions = !nameOnly && (can('customers', 'edit') || can('customers', 'delete'));

  if (error) {
    return (
      <Alert
        severity="error"
        action={<Button color="inherit" size="small" onClick={reload}>{t('customers.retry')}</Button>}
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>{t('customers.title')}</Typography>

      <Paper variant="outlined" sx={{ borderColor: 'divider' }}>
        <Box
          sx={{
            display: 'flex', gap: 2, p: 2, flexWrap: 'wrap',
            justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flex: 1 }}>
            <TextField
              size="small"
              value={search}
              onChange={handleSearch}
              placeholder={t('customers.searchPlaceholder')}
              sx={{ minWidth: { xs: '100%', sm: 280 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                  ),
                },
              }}
            />
            {!nameOnly && (
              <TextField
                select size="small" value={type} onChange={handleType}
                label={t('customers.type')} sx={{ minWidth: 160 }}
              >
                <MenuItem value="">{t('customers.allTypes')}</MenuItem>
                {TYPES.map((x) => (
                  <MenuItem key={x} value={x}>{t(`customers.types.${x}`)}</MenuItem>
                ))}
              </TextField>
            )}
          </Box>

          {can('customers', 'create') && (
            <Button
              variant="contained" startIcon={<AddIcon />}
              onClick={() => setFormCustomer(null)} sx={{ minHeight: 42 }}
            >
              {t('customers.add')}
            </Button>
          )}
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F5F9FF' }}>
                <TableCell sortDirection={sort === 'name' ? dir : false}>
                  <TableSortLabel
                    active={sort === 'name'} direction={sort === 'name' ? dir : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    {t('customers.name')}
                  </TableSortLabel>
                </TableCell>
                {!nameOnly && (
                  <>
                    <TableCell sortDirection={sort === 'mobile' ? dir : false}>
                      <TableSortLabel
                        active={sort === 'mobile'} direction={sort === 'mobile' ? dir : 'asc'}
                        onClick={() => handleSort('mobile')}
                      >
                        {t('customers.mobile')}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>{t('customers.type')}</TableCell>
                    <TableCell align="right">{t('customers.totalJobs')}</TableCell>
                    <TableCell align="right">{t('customers.balanceDue')}</TableCell>
                    <TableCell>{t('customers.status')}</TableCell>
                    <TableCell align="right">{showActions ? t('customers.actions') : ''}</TableCell>
                  </>
                )}
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
                    <Typography color="text.secondary">{t('customers.empty')}</Typography>
                  </TableCell>
                </TableRow>
              )}

              {!loading && rows.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                  {!nameOnly && (
                    <>
                      <TableCell>{c.mobile}</TableCell>
                      <TableCell>{t(`customers.types.${c.type}`)}</TableCell>
                      <TableCell align="right">{c.total_jobs}</TableCell>
                      <TableCell align="right" sx={{ color: c.balance_due > 0 ? 'error.main' : undefined }}>
                        {money(c.balance_due)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small" variant="outlined"
                          label={c.is_active ? t('customers.active') : t('customers.inactive')}
                          color={c.is_active ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {can('customers', 'edit') && (
                          <Tooltip title={t('customers.edit')}>
                            <IconButton onClick={() => setFormCustomer(c)}>
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {can('customers', 'delete') && (
                          <Tooltip title={t('customers.delete')}>
                            <IconButton color="error" onClick={() => setDeleting(c)}>
                              <DeleteOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div" count={total} page={page} onPageChange={handlePage}
          rowsPerPage={perPage} onRowsPerPageChange={handlePerPage}
          rowsPerPageOptions={[25, 50, 100]}
        />

        {formCustomer !== undefined && (
          <CustomerForm
            key={formCustomer ? formCustomer.id : 'new'}
            customer={formCustomer}
            onClose={() => setFormCustomer(undefined)}
            onSaved={handleSaved}
          />
        )}

        <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)}>
          <DialogTitle>{t('customers.deleteTitle')}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {t('customers.deleteConfirm', { name: deleting?.name })}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleting(null)} disabled={deleteBusy}>
              {t('customers.cancel')}
            </Button>
            <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleteBusy}>
              {t('customers.delete')}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={Boolean(snack)} autoHideDuration={3000}
          onClose={() => setSnack('')} message={snack}
        />
      </Paper>
    </Box>
  );
}