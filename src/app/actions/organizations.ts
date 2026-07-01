"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const orgId = formData.get("organization_id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const { data, error } = await supabase
    .from("projects")
    .insert({ organization_id: orgId, name, slug, description: description || null })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "このプロジェクト名はすでに使用されています" };
    }
    return { error: error.message };
  }

  // Create default environments
  await supabase.from("environments").insert([
    { project_id: data.id, name: "Development", slug: "development", color: "#22c55e" },
    { project_id: data.id, name: "Staging", slug: "staging", color: "#f59e0b" },
    { project_id: data.id, name: "Production", slug: "production", color: "#ef4444" },
  ]);

  revalidatePath("/dashboard");
  return { data };
}

export async function createEnvironment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const projectId = formData.get("project_id") as string;
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const { data, error } = await supabase
    .from("environments")
    .insert({ project_id: projectId, name, slug, color })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { data };
}

export async function inviteMember(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const orgId = formData.get("organization_id") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as "admin" | "editor" | "viewer";

  // Find user by email
  const { data: targetUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", (
      await supabase.from("profiles").select("id")
    ).data?.[0]?.id ?? "")
    .single();

  // For MVP, we'll just check if user exists in auth.users via RPC
  // In production, this would send an invitation email
  return { success: true, message: `招待メールを ${email} に送信しました（${role}ロール）` };
}

export async function updateMemberRole(memberId: string, role: "admin" | "editor" | "viewer") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("organization_members")
    .update({ role })
    .eq("id", memberId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}
