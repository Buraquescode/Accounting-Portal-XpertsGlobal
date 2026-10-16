import { useCallback, useEffect, useState } from 'react';
import * as requestsApi from '../api/requests.api';

// Loads a role-scoped page of requests. The server applies scoping; we only pass filters.
export function useRequests({ status, type, page, limit = 10 }) {
  const [state, setState] = useState({ data: [], meta: null, loading: true, error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const params = { page, limit };
      if (status) params.status = status;
      if (type) params.type = type;
      const res = await requestsApi.list(params);
      setState({ data: res.data, meta: res.meta || null, loading: false, error: null });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
    }
  }, [status, type, page, limit]);

  useEffect(() => { load(); }, [load]);

  return { ...state, refresh: load };
}
