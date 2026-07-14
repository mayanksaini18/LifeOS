"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { Mood, MoodTrendsResponse } from "@/types/mood";

export function useMoods(limit = 30) {
  return useQuery<Mood[]>({
    queryKey: ["moods", limit],
    queryFn: () => fetchApi(`/mood?limit=${limit}`),
  });
}

export function useMoodTrends() {
  return useQuery<MoodTrendsResponse>({
    queryKey: ["moods", "trends"],
    queryFn: () => fetchApi("/mood/trends"),
  });
}

export function useLogMood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { score: number; energy?: number; notes?: string; tags?: string[] }) =>
      fetchApi<Mood>("/mood", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moods"] });
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
  });
}

export function useDeleteMood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi(`/mood/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moods"] });
    },
  });
}
