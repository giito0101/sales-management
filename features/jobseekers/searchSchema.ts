import { z } from "zod";

export const jobSeekerSearchSchema = z.object({
  q: z.string().max(255, "検索ワードが適切ではありません"),
});

export type JobSeekerSearchInput = z.infer<typeof jobSeekerSearchSchema>;
