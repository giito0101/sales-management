import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  email: z.string().email("メール形式が正しくありません"),
  age: z.coerce.number().int().min(0, "0以上にしてください").optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
