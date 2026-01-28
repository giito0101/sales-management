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
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(120).nullable().optional(),
  email: z.string().email().max(255),
  phone: z
    .string()
    .max(20)
    .regex(/^[0-9-]+$/, "電話番号は数字とハイフンのみです"),
  desiredJobType: z.string().min(1).max(100),
  desiredLocation: z.string().min(1).max(100),

  salesUserId: z.string().min(1).max(50).optional(), // プルダウン
  status: jobSeekerStatusSchema.optional(),
  memo: z.string().max(2000).nullable().optional(),
});

export type JobSeekerEditInput = z.infer<typeof jobSeekerEditSchema>;
