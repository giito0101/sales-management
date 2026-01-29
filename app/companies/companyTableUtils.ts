export type CompanyRow = {
  id: string;
  name: string;
  contact: string | null;
  industry: string;
  staff: string;
};

export type SortKey = "id" | "name";
export type SortOrder = "asc" | "desc";

export function buildCompanyListUrl(
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
  return `/companies?${params.toString()}`;
}

export function getNextSortOrder(input: {
  currentSortKey: SortKey;
  currentSortOrder: SortOrder;
  nextKey: SortKey;
}) {
  const isSameKey = input.currentSortKey === input.nextKey;
  if (isSameKey) return input.currentSortOrder === "asc" ? "desc" : "asc";
  return "asc";
}
