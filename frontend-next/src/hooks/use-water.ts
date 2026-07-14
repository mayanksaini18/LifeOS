"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { Water } from "@/types/water";

export function useWaterToday() {
  return useQuery<Water>({
    queryKey: ["water", "today"],
    queryFn: () => fetchApi("/water/today"),
  });
}

export function useWaterHistory(limit = 30) {
  return useQuery<Water[]>({
    queryKey: ["water", "history", limit],
    queryFn: () => fetchApi(`/water?limit=${limit}`),
  });
}

export function useLogWater() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: { glasses?: number; goal?: number }) =>
      fetchApi<Water>("/water", {
        method: "POST",
        body: JSON.stringify(data || {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["water"] });
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
  });
}

export function useSetWaterGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (goal: number) =>
      fetchApi<Water>("/water/goal", {
        method: "PUT",
        body: JSON.stringify({ goal }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["water"] });
    },
  });
}
