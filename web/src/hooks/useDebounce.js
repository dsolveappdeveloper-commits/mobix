import { useEffect, useState } from 'react';

// value maarina udane illa, delay ms kazhichu dhaan result maarum
export default function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // value thirumba maarina pazhaya timer cancel
  }, [value, delay]);

  return debounced;
}