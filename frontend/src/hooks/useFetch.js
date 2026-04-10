// src/hooks/useFetch.js
import { useState, useEffect, useCallback } from "react";

export function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (e) {
      setError(e.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line

  useEffect(() => { execute(); }, [execute]);

  return { data, loading, error, refetch: execute };
}
