export type JobSeekerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "NEW" | "INTERVIEWED" | "PROPOSING" | "OFFERED" | "CLOSED";
  updatedAt: string; // ISO
  salesUser: { name: string };
};

export type SortKey = "updatedAt" | "id" | "name";
export type SortOrder = "asc" | "desc";

const STATUS_LABELS: Record<JobSeekerRow["status"], string> = {
  NEW: "新規",
  INTERVIEWED: "面談済",
  PROPOSING: "提案中",
  OFFERED: "内定",
  CLOSED: "終了",
};

export function statusLabel(s: JobSeekerRow["status"]) {
  return STATUS_LABELS[s] ?? s;
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  // 最小構成：日本語表示
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function buildJobSeekerListUrl(
  baseParams: string,
  next: {
    q?: string;
    sortKey?: SortKey;
    sortOrder?: SortOrder;
  }
) {
  const params = new URLSearchParams(baseParams);
  if (next.q !== undefined) {
    if (next.q) params.set("q", next.q);
    else params.delete("q");
  }
  if (next.sortKey !== undefined) params.set("sortKey", next.sortKey);
  if (next.sortOrder !== undefined) params.set("sortOrder", next.sortOrder);
  return `/jobseekers?${params.toString()}`;
}

export function getNextSortOrder(input: {
  currentSortKey: SortKey;
  currentSortOrder: SortOrder;
  nextKey: SortKey;
}) {
  const isSameKey = input.currentSortKey === input.nextKey;
  if (isSameKey) return input.currentSortOrder === "asc" ? "desc" : "asc";
  return input.nextKey === "updatedAt" ? "desc" : "asc";
}
