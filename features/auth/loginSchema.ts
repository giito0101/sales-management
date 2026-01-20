import { z } from "zod";

export const loginSchema = z.object({
  id: z
    .string()
    .min(1, "IDは必須です")
    .max(50, "IDは50文字以内です")
    .regex(/^[A-Za-z0-9_-]+$/, "IDは英数字と - _ のみ使えます"),
  password: z
    .string()
    .min(8, "パスワードは必須です")
    .max(255, "パスワードが長すぎます"),
});

export type LoginInput = z.infer<typeof loginSchema>;
