import { useCallback, useEffect, useState } from 'react';

// Load-once screens ku. fetcher stable ah irukkanum (module level function, e.g. getShop).
export default function useFetch(fetcher) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    fetcher()
      .then((res) => {
        if (!ignore) setState({ data: res.data, loading: false, error: null });
      })
      .catch((err) => {
        if (!ignore) setState({ data: null, loading: false, error: err });
      });
    return () => {
      ignore = true;
    };
  }, [fetcher, reloadKey]);

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    setReloadKey((k) => k + 1);
  }, []);

  return { ...state, reload };
}
