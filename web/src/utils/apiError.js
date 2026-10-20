// Edha screen laum: setError(apiMessage(err, t))
export function apiMessage(err, t) {
  if (err.response?.status === 429) return t('auth.tooMany');
  return err.response?.data?.message || t('auth.genericError');
}