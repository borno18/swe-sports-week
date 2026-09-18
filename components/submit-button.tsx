"use client";

import { useFormStatus } from "react-dom";
import { ShieldCheck } from "lucide-react";

export function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="button primary" type="submit" disabled={pending} aria-busy={pending}>
    <ShieldCheck size={17} /> {pending ? "Signing in…" : "Sign in securely"}
  </button>;
}
