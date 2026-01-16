"use server";
import { signupSchema } from "./schema";

export type ActionState =
  | { ok: true; data: any }
  | { ok: false; errors: Record<string, string[]> };

export async function submitSignup(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    age: formData.get("age"),
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  return { ok: true, data: parsed.data };
}
