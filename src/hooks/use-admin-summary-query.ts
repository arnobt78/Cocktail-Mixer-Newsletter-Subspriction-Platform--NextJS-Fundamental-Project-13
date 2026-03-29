"use client";

/** Shared query key + fetcher so overview and other panels can invalidate the same admin summary cache. */
import { useQuery } from "@tanstack/react-query";
import type { ControlRoomSummary } from "@/lib/newsletter/control-room";

const QUERY_KEY = ["admin", "control-room", "summary"] as const;

export async function fetchAdminControlRoomSummary(): Promise<ControlRoomSummary> {
  const res = await fetch("/api/admin/control-room/summary");
  if (!res.ok) {
    throw new Error("Failed to load admin summary.");
  }
  return res.json() as Promise<ControlRoomSummary>;
}

export function useAdminSummaryQuery(initialData: ControlRoomSummary) {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchAdminControlRoomSummary,
    initialData,
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  });
}

export function adminSummaryQueryKey() {
  return QUERY_KEY;
}
