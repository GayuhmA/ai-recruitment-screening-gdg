import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import type {
  CandidateProfile,
  CreateCandidateRequest,
  UpdateCandidateRequest,
  SearchParams,
} from '@/types/api';

/**
 * Hook to fetch list of candidates with pagination and search
 * Includes auto-refetch for real-time updates
 */
export function useCandidates(params?: SearchParams) {
  return useQuery({
    queryKey: queryKeys.candidates.list(params),
    queryFn: () => api.candidates.list(params),
    enabled: true,
    // Auto-refetch every 5 seconds to keep data fresh
    refetchInterval: 5000,
    // Don't pause refetch when window is not focused (good for development)
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook to fetch single candidate detail
 */
export function useCandidate(candidateId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.candidates.detail(candidateId!),
    queryFn: () => api.candidates.get(candidateId!),
    enabled: !!candidateId,
  });
}

/**
 * Hook to create a new candidate
 */
export function useCreateCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCandidateRequest) => api.candidates.create(data),
    onSuccess: (newCandidate) => {
      toast.success('Candidate created', {
        description: `${newCandidate.name} has been added to the system`,
      });
      
      // Invalidate ALL candidate queries to force refresh everywhere
      queryClient.invalidateQueries({ queryKey: queryKeys.candidates.all });
      queryClient.setQueryData(queryKeys.candidates.detail(newCandidate.id), newCandidate);
    },
    onError: (error: any) => {
      toast.error('Failed to create candidate', {
        description: error?.message || 'Please try again later',
      });
    },
  });
}

/**
 * Hook to update an existing candidate
 */
export function useUpdateCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ candidateId, data }: { candidateId: string; data: UpdateCandidateRequest }) =>
      api.candidates.update(candidateId, data),
    onSuccess: (updatedCandidate, variables) => {
      toast.success('Candidate updated', {
        description: 'Candidate information has been saved',
      });
      
      queryClient.setQueryData(queryKeys.candidates.detail(variables.candidateId), updatedCandidate);
      // Invalidate ALL candidate queries to force refresh everywhere
      queryClient.invalidateQueries({ queryKey: queryKeys.candidates.all });
    },
    onError: (error: any) => {
      toast.error('Failed to update candidate', {
        description: error?.message || 'Please try again later',
      });
    },
  });
}

/**
 * Hook to delete a candidate
 */
export function useDeleteCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (candidateId: string) => api.candidates.delete(candidateId),
    onSuccess: (_, candidateId) => {
      toast.success('Candidate deleted', {
        description: 'The candidate has been removed from the system',
      });
      
      queryClient.removeQueries({ queryKey: queryKeys.candidates.detail(candidateId) });
      // Invalidate ALL candidate queries to force refresh everywhere
      queryClient.invalidateQueries({ queryKey: queryKeys.candidates.all });
    },
    onError: (error: any) => {
      toast.error('Failed to delete candidate', {
        description: error?.message || 'Please try again later',
      });
    },
  });
}
