// features/jobseekers/jobSeekerEditSchema.ts
import { z } from "zod";

export const jobSeekerStatusSchema = z.enum([
  "NEW",
  "INTERVIEWED",
  "PROPOSING",
  "OFFERED",
  "CLOSED",
]);

export const jobSeekerEditSchema = z.object({
  name: z.string().min(1, "氏名は必須です").max(100, "氏名は100文字以内です"),
  age: z
    .number()
    .int("年齢は整数です")
    .min(0, "年齢は0〜120です")
    .max(120, "年齢は0〜120です")
    .nullable()
    .optional(),
  email: z
    .string()
    .min(1, "メールアドレスは必須です")
    .max(255, "メールアドレスは255文字以内です")
    .email("メール形式が不正です"),
  phone: z
    .string()
    .min(1, "電話番号は必須です")
    .max(20, "電話番号は20文字以内です")
    .regex(/^[0-9-]+$/, "電話番号は数字とハイフンのみです"),
  desiredJobType: z
    .string()
    .min(1, "希望職種は必須です")
    .max(100, "希望職種は100文字以内です"),
  desiredLocation: z
    .string()
    .min(1, "希望勤務地は必須です")
    .max(100, "希望勤務地は100文字以内です"),

  salesUserId: z.string().min(1).max(50).optional(), // プルダウン
  status: jobSeekerStatusSchema.optional(),
  memo: z
    .string()
    .max(2000, "メモは2000文字以内です")
    .nullable()
    .optional(),
});

export type JobSeekerEditInput = z.infer<typeof jobSeekerEditSchema>;
