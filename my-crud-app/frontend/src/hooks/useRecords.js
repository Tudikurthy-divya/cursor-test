import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';

export function useRecords() {
  const { api } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/records');
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to load records');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const createRecord = useCallback(
    async (payload) => {
      const { data } = await api.post('/records', payload);
      setRecords((prev) => [data, ...prev]);
      return data;
    },
    [api]
  );

  const updateRecord = useCallback(
    async (id, payload) => {
      const { data } = await api.put(`/records/${id}`, payload);
      setRecords((prev) => prev.map((r) => (r.id === id ? data : r)));
      return data;
    },
    [api]
  );

  const deleteRecord = useCallback(
    async (id) => {
      await api.delete(`/records/${id}`);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    },
    [api]
  );

  return {
    records,
    loading,
    error,
    fetchRecords,
    createRecord,
    updateRecord,
    deleteRecord,
  };
}
