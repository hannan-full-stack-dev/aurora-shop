import { useCallback, useEffect, useState } from 'react';
import { fetchProducts } from '../api';

export default function useProducts() {
  const [state, setState] = useState({ products: [], loading: true, error: null });

  const load = useCallback(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchProducts()
      .then((products) => alive && setState({ products, loading: false, error: null }))
      .catch((err) =>
        alive && setState({ products: [], loading: false, error: err.message || 'Something went wrong' })
      );
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => load(), [load]);

  return { ...state, reload: load };
}
