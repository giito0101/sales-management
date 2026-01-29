import { z } from "zod";

export const companySearchParamsSchema = z.object({
  q: z.string().max(255, "検索ワードが適切ではありません").optional(),
  sortKey: z.enum(["id", "name"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type CompanySearchInput = z.infer<typeof companySearchParamsSchema>;
