import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

/**
 * Hook to fetch current user from server
 * Refreshes user data from backend
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.users.me(),
    queryFn: () => api.users.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook to get user from local storage
 * Faster but may be stale
 */
export function useLocalUser() {
  return api.auth.getCurrentUser();
}
