// app/jobseekers/[jobseekerId]/jobSeekerDetailUtils.ts
export type JobSeekerStatus =
  | "NEW"
  | "INTERVIEWED"
  | "PROPOSING"
  | "OFFERED"
  | "CLOSED";

export type JobSeekerDetailDto = {
  id: string;
  name: string;
  age: number | null;
  email: string;
  phone: string;
  desiredJobType: string;
  desiredLocation: string;
  status: JobSeekerStatus;
  updatedAt: string; // ISO
  memo: string | null;
  salesUserName: string;
};

export type JobSeekerHistoryDto = {
  id: string;
  status: JobSeekerStatus;
  memo: string | null;
  salesUserId: string;
  salesUserName: string;
  createdAt: string; // ISO
};

const STATUS_LABELS: Record<JobSeekerStatus, string> = {
  NEW: "新規",
  INTERVIEWED: "面談済",
  PROPOSING: "提案中",
  OFFERED: "内定",
  CLOSED: "終了",
};

export function statusLabel(status: JobSeekerStatus) {
  return STATUS_LABELS[status] ?? status;
}

export function formatDateTime(iso: string) {
  // 例: 2026/01/23 19:12
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
}
