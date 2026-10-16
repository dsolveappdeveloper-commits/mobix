import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, IconButton, Paper, Snackbar, Table, TableBody,
  TableCell, TableContainer, TableHead, TablePagination, TableRow, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import { deleteBranch, listBranches } from '../../api/branches';
import { useAuth } from '../../context/AuthContext';
import BranchForm from './BranchForm';

export default function Branches() {
  const { t } = useTranslation();
  const { branchId, setBranchId, can, refreshMe } = useAuth();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0); 
  const [perPage, setPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [formBranch, setFormBranch] = useState(undefined);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [snack, setSnack] = useState('');

  useEffect(() => {
    let ignore = false;

    const params = { page: page + 1, per_page: perPage };
    if (branchId !== 'all') params.id = branchId;

    listBranches(params)
      .then((res) => {
        if (ignore) return;
        setRows(res.data.data);
        setTotal(res.data.total);
      })
      .catch(() => {
        if (!ignore) setError(t('branches.loadError'));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [page, perPage, branchId, reloadKey, t]);

  const reload = () => {
    setLoading(true);
    setError('');
    setReloadKey((k) => k + 1);
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
    setFormBranch(undefined);
    setSnack(t('branches.saved'));
    reload();
    refreshMe();
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await deleteBranch(deleting.id);
      if (String(deleting.id) === branchId) setBranchId('all');
      setDeleting(null);
      setSnack(t('branches.deleted'));
      reload();
      refreshMe();
    } catch (err) {
      setDeleting(null);
      setSnack(err.response?.data?.message || t('branches.saveError'));
    } finally {
      setDeleteBusy(false);
    }
  };

  if (error) {
    return (
      <Alert
        severity="error"
        action={<Button color="inherit" size="small" onClick={reload}>{t('branches.retry')}</Button>}
      >
        {error}
      </Alert>
    );
  }

  return (
    <Paper variant="outlined" sx={{ borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
        {can('settings', 'create') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormBranch(null)}
            sx={{ minHeight: 42 }}
          >
            {t('branches.add')}
          </Button>
        )}
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F5F9FF' }}>
              <TableCell>{t('branches.name')}</TableCell>
              <TableCell>{t('branches.code')}</TableCell>
              <TableCell>{t('branches.phone')}</TableCell>
              <TableCell>{t('branches.opening')}</TableCell>
              <TableCell>{t('branches.status')}</TableCell>
              <TableCell align="right">{t('branches.actions')}</TableCell>
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
                  <Typography color="text.secondary">{t('branches.empty')}</Typography>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              rows.map((b) => (
                <TableRow key={b.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{b.name}</TableCell>
                  <TableCell>{b.code}</TableCell>
                  <TableCell>{b.phone || '-'}</TableCell>
                  <TableCell>{b.opening_time ? b.opening_time.slice(0, 5) : '-'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={b.is_active ? t('branches.active') : t('branches.inactive')}
                      color={b.is_active ? 'success' : 'default'}
                                            variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {can('settings', 'edit') && (
                      <Tooltip title={t('branches.edit')}>
                        <IconButton onClick={() => setFormBranch(b)}>
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {can('settings', 'delete') && (
                      <Tooltip title={t('branches.delete')}>
                        <IconButton color="error" onClick={() => setDeleting(b)}>
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

      <Box>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handlePage}
          rowsPerPage={perPage}
          onRowsPerPageChange={handlePerPage}
          rowsPerPageOptions={[25, 50, 100]}
        />
      </Box>

      {formBranch !== undefined && (
        <BranchForm
          key={formBranch ? formBranch.id : 'new'}
          branch={formBranch}
          onClose={() => setFormBranch(undefined)}
          onSaved={handleSaved}
        />
      )}

      <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)}>
        <DialogTitle>{t('branches.deleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('branches.deleteConfirm', { name: deleting?.name })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleting(null)} disabled={deleteBusy}>
            {t('branches.cancel')}
          </Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleteBusy}>
            {t('branches.delete')}
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