import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiClient, CreateMomentRequest, HealthResponse } from "./client";

/** Query key factories — single source of truth for cache keys. */
export const momentKeys = {
  health: ["health"] as const,
  lists: () => ["moments", "list"] as const,
};

export function healthQueryOptions(client: ApiClient) {
  return { queryKey: momentKeys.health, queryFn: () => client.getHealth() };
}

export function useHealth(client: ApiClient) {
  return useQuery<HealthResponse>(healthQueryOptions(client));
}

export interface OptimisticMoment {
  moment: unknown;
  receivedAt: string;
  optimistic: true;
}

/** Pure helpers (unit-tested) behind the optimistic update flow. */
export function applyOptimisticMoment(
  old: unknown,
  optimistic: OptimisticMoment,
): OptimisticMoment[] {
  const list = Array.isArray(old) ? (old as OptimisticMoment[]) : [];
  return [optimistic, ...list];
}

export function useCreateMoment(client: ApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMomentRequest) => client.createMoment(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: momentKeys.lists() });
      const previous = queryClient.getQueriesData({ queryKey: momentKeys.lists() });
      const optimistic: OptimisticMoment = {
        moment: input,
        receivedAt: new Date().toISOString(),
        optimistic: true,
      };
      queryClient.setQueriesData({ queryKey: momentKeys.lists() }, (old: unknown) =>
        applyOptimisticMoment(old, optimistic),
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      for (const [key, data] of context?.previous ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: momentKeys.lists() });
    },
  });
}
