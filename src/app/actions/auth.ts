"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Schemas ──────────────────────────────────────────────────────────

const SignInSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードは必須です"),
});

const SignUpSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上必要です"),
  full_name: z.string().min(1, "名前は必須です").max(100),
  org_name: z.string().min(1, "組織名は必須です").max(100),
});

const ResetPasswordSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
});

const UpdatePasswordSchema = z.object({
  password: z.string().min(8, "パスワードは8文字以上必要です"),
});

// ── Actions ─────────────────────────────────────────────────────────

export async function signIn(formData: FormData) {
  const parsed = SignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const parsed = SignUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("full_name"),
    org_name: formData.get("org_name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { email, password, full_name, org_name } = parsed.data;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    // Create organization and add user as owner
    const slug = org_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: org_name, slug: `${slug}-${data.user.id.slice(0, 8)}` })
      .select()
      .single();

    if (!orgError && org) {
      await supabase.from("organization_members").insert({
        organization_id: org.id,
        user_id: data.user.id,
        role: "owner",
      });
    }
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function resetPassword(formData: FormData) {
  const parsed = ResetPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "パスワードリセットメールを送信しました。" };
}

export async function updatePassword(formData: FormData) {
  const parsed = UpdatePasswordSchema.safeParse({
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  redirect("/dashboard");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect(data.url);
}
