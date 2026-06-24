"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  success?: boolean;
};

export async function loginAction(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const t = await getTranslations("auth.errors");

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: t("credentialsRequired") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signupAction(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const t = await getTranslations("auth.errors");

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !password) {
    return { error: t("allFieldsRequired") };
  }

  if (password.length < 6) {
    return { error: t("passwordTooShort") };
  }

  if (password !== confirmPassword) {
    return { error: t("passwordsDoNotMatch") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  return {
    success: true,
  };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
