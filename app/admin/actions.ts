"use server";

import { redirect } from "next/navigation";
import { authenticate, createSession, destroySession } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 8 || password.length > 200) {
    redirect("/admin?error=invalid");
  }

  const result = await authenticate(email, password);
  if (!result.ok) {
    redirect(`/admin?error=${result.reason}`);
  }

  await createSession(result.user.id);
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin");
}
