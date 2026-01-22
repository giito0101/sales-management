import { z } from "zod";

export const jobSeekerCreateSchema = z.object({
  name: z.string().min(1, "氏名は必須です").max(100, "氏名は100文字以内です"),
  age: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      if (typeof v === "number") return v;
      const s = v.trim();
      if (s === "") return undefined;
      return Number(s);
    })
    .refine((v) => v === undefined || Number.isInteger(v), "年齢は整数です")
    .refine((v) => v === undefined || (v >= 0 && v <= 120), "年齢は0〜120です"),
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
  memo: z
    .string()
    .optional()
    .transform((v) => (v?.trim() === "" ? undefined : v))
    .refine(
      (v) => v === undefined || v.length <= 2000,
      "メモは2000文字以内です",
    ),
});

export type JobSeekerCreateInput = z.infer<typeof jobSeekerCreateSchema>;
