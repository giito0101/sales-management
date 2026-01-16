"use client";

import { useActionState } from "react";
import { submitSignup, type ActionState } from "./actions";

const initialState: ActionState | null = null;

export default function Page() {
  const [state, action] = useActionState(submitSignup, initialState);

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h1>Zod 動作確認</h1>

      <form action={action}>
        <input name="name" placeholder="name" />
        <input name="email" placeholder="email" />
        <input name="age" placeholder="age" />
        <button type="submit">送信</button>
      </form>

      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
}
