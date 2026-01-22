import { z } from "zod";

export const jobSeekerSearchParamsSchema = z.object({
  q: z.string().max(255, "検索ワードが適切ではありません").optional(),
  sortKey: z.enum(["updatedAt", "id", "name"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type JobSeekerSearchInput = z.infer<typeof jobSeekerSearchParamsSchema>;
