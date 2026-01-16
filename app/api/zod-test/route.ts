import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "名前は必須です"),
  email: z.string().email("メール形式が正しくありません"),
  age: z.coerce.number().int().min(0, "0以上にしてください").optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, data: parsed.data });
}
