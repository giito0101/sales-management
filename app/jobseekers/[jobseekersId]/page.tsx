// app/jobseekers/[jobseekersId]/page.tsx
export default function JobSeekerDetailPage({
  params,
}: {
  params: { jobseekersId: string };
}) {
  return (
    <div className="p-6 space-y-2">
      <h1 className="text-xl font-bold">求職者詳細</h1>
      <p className="text-sm text-muted-foreground">ID: {params.jobseekersId}</p>
      {/* 後で詳細API/画面を実装 */}
    </div>
  );
}
