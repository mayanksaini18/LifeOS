"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { Fitness, FitnessStats, Exercise } from "@/types/fitness";

export function useFitnessHistory(limit = 30) {
  return useQuery<Fitness[]>({
    queryKey: ["fitness", limit],
    queryFn: () => fetchApi(`/fitness?limit=${limit}`),
  });
}

export function useFitnessStats() {
  return useQuery<FitnessStats>({
    queryKey: ["fitness", "stats"],
    queryFn: () => fetchApi("/fitness/stats"),
  });
}

export function useLogExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { exercises: Omit<Exercise, "calories">[]; date?: string }) =>
      fetchApi<Fitness>("/fitness", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fitness"] });
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
  });
}
