"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { Sleep, SleepStats } from "@/types/sleep";

export function useSleepHistory(limit = 30) {
  return useQuery<Sleep[]>({
    queryKey: ["sleep", limit],
    queryFn: () => fetchApi(`/sleep?limit=${limit}`),
  });
}

export function useSleepStats() {
  return useQuery<SleepStats>({
    queryKey: ["sleep", "stats"],
    queryFn: () => fetchApi("/sleep/stats"),
  });
}

export function useLogSleep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      duration: number;
      quality: number;
      bedtime?: string;
      wakeTime?: string;
      notes?: string;
      date?: string;
    }) =>
      fetchApi<Sleep>("/sleep", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sleep"] });
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
  });
}
