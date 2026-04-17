import { createContext, ReactNode, useContext, useMemo } from 'react';
import { ApiClient, createApiClient } from './api';
import { useAuth } from '@/auth/AuthContext';

const ApiCtx = createContext<ApiClient | null>(null);

export function ApiProvider({ children }: { children: ReactNode }) {
  const { getIdToken } = useAuth();
  const client = useMemo(() => createApiClient(getIdToken), [getIdToken]);
  return <ApiCtx.Provider value={client}>{children}</ApiCtx.Provider>;
}

export function useApi(): ApiClient {
  const client = useContext(ApiCtx);
  if (!client) throw new Error('useApi must be used within ApiProvider');
  return client;
}
