"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import type { HabitsResponse, Habit, AnalyticsDay } from "@/types/habit";

export function useHabits() {
  return useQuery<HabitsResponse>({
    queryKey: ["habits"],
    queryFn: () => fetchApi("/habits"),
  });
}

export function useWeeklyAnalytics() {
  return useQuery<AnalyticsDay[]>({
    queryKey: ["analytics", "weekly"],
    queryFn: () => fetchApi("/habits/analytics/weekly"),
  });
}

export function useCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (habitId: string) =>
      fetchApi<{ habit: Habit; user: { xp: number; level: number } }>(
        `/habits/${habitId}/checkin`,
        { method: "POST" }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      frequency?: string;
    }) =>
      fetchApi<Habit>("/habits", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { title?: string; description?: string; frequency?: string };
    }) =>
      fetchApi<Habit>(`/habits/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (habitId: string) =>
      fetchApi(`/habits/${habitId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

export function useCheckinWithFreeze() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (habitId: string) =>
      fetchApi<{ habit: Habit; user: { xp: number; level: number }; freezeUsed: boolean }>(
        `/habits/${habitId}/checkin`,
        { method: "POST" }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
  });
}
