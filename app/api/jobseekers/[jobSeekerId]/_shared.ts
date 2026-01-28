// app/api/jobseekers/[jobSeekerId]/_shared.ts
export const ORDER = [
  "NEW",
  "INTERVIEWED",
  "PROPOSING",
  "OFFERED",
  "CLOSED",
] as const;
export type Status = (typeof ORDER)[number];

export function isAllowedTransition(from: Status, to: Status) {
  if (from === to) return true;
  if (to === "CLOSED") return true;
  const fromIdx = ORDER.indexOf(from);
  const toIdx = ORDER.indexOf(to);
  return toIdx === fromIdx + 1;
}
