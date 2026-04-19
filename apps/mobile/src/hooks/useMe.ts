import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/lib/apiProvider';

export function useMe() {
  const api = useApi();
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.me(),
    staleTime: 60_000,
  });
}
