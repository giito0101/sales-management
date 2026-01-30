import { z } from "zod";

export const companyEditSchema = z.object({
  name: z.string().min(1, "企業名は必須です").max(200, "企業名は200文字以内です"),
  contact: z
    .string()
    .max(500, "連絡先は500文字以内です")
    .nullable()
    .optional(),
  industry: z
    .string()
    .min(1, "業種は必須です")
    .max(100, "業種は100文字以内です"),
  staff: z
    .string()
    .min(1, "担当者は必須です")
    .max(100, "担当者は100文字以内です"),
});

export type CompanyEditInput = z.infer<typeof companyEditSchema>;
