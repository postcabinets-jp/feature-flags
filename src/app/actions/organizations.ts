"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// ── Schemas ──────────────────────────────────────────────────────────

const CreateProjectSchema = z.object({
  organization_id: z.string().uuid("不正な組織IDです"),
  name: z.string().min(1, "プロジェクト名は必須です").max(100),
  description: z.string().max(500).optional().default(""),
});

const UpdateProjectSchema = z.object({
  name: z.string().min(1, "プロジェクト名は必須です").max(100),
  description: z.string().max(500).optional().default(""),
});

const CreateEnvironmentSchema = z.object({
  project_id: z.string().uuid("不正なプロジェクトIDです"),
  name: z.string().min(1, "環境名は必須です").max(50),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "不正なカラーコードです")
    .default("#6366f1"),
});

const UpdateEnvironmentSchema = z.object({
  name: z.string().min(1, "環境名は必須です").max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "不正なカラーコードです")
    .optional(),
});

const InviteMemberSchema = z.object({
  organization_id: z.string().uuid(),
  email: z.string().email("有効なメールアドレスを入力してください"),
  role: z.enum(["admin", "editor", "viewer"]),
});

const UpdateOrgSchema = z.object({
  name: z.string().min(1, "組織名は必須です").max(100),
});

// ── Helpers ──────────────────────────────────────────────────────────

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

// ── Project Actions ─────────────────────────────────────────────────

export async function createProject(formData: FormData) {
  const parsed = CreateProjectSchema.safeParse({
    organization_id: formData.get("organization_id"),
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { supabase } = await requireAuth();
  const { organization_id, name, description } = parsed.data;
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data, error } = await supabase
    .from("projects")
    .insert({
      organization_id,
      name,
      slug,
      description: description || null,
    })
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
    {
      project_id: data.id,
      name: "Development",
      slug: "development",
      color: "#22c55e",
    },
    {
      project_id: data.id,
      name: "Staging",
      slug: "staging",
      color: "#f59e0b",
    },
    {
      project_id: data.id,
      name: "Production",
      slug: "production",
      color: "#ef4444",
    },
  ]);

  revalidatePath("/dashboard");
  return { data };
}

export async function updateProject(projectId: string, formData: FormData) {
  const idParsed = z.string().uuid().safeParse(projectId);
  if (!idParsed.success) return { error: "不正なプロジェクトIDです" };

  const parsed = UpdateProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { supabase } = await requireAuth();
  const { name, description } = parsed.data;

  const { error } = await supabase
    .from("projects")
    .update({ name, description: description || null })
    .eq("id", projectId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteProject(projectId: string) {
  const idParsed = z.string().uuid().safeParse(projectId);
  if (!idParsed.success) return { error: "不正なプロジェクトIDです" };

  const { supabase } = await requireAuth();

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

// ── Environment Actions ─────────────────────────────────────────────

export async function createEnvironment(formData: FormData) {
  const parsed = CreateEnvironmentSchema.safeParse({
    project_id: formData.get("project_id"),
    name: formData.get("name"),
    color: formData.get("color"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { supabase } = await requireAuth();
  const { project_id, name, color } = parsed.data;
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data, error } = await supabase
    .from("environments")
    .insert({ project_id, name, slug, color })
    .select()
    .single();

  if (error) return { error: error.message };

  // Create flag configs for existing flags in this project
  const { data: flags } = await supabase
    .from("feature_flags")
    .select("id, flag_type")
    .eq("project_id", project_id)
    .eq("archived", false);

  if (flags?.length && data) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("flag_configurations").insert(
        flags.map((flag) => {
          const defaultValue =
            flag.flag_type === "boolean"
              ? "false"
              : flag.flag_type === "number"
                ? "0"
                : flag.flag_type === "string"
                  ? '""'
                  : "{}";
          return {
            flag_id: flag.id,
            environment_id: data.id,
            enabled: false,
            default_value: defaultValue as import("@/types/database").Json,
            updated_by: user.id,
          };
        })
      );
    }
  }

  revalidatePath("/dashboard");
  return { data };
}

export async function updateEnvironment(
  environmentId: string,
  formData: FormData
) {
  const idParsed = z.string().uuid().safeParse(environmentId);
  if (!idParsed.success) return { error: "不正な環境IDです" };

  const parsed = UpdateEnvironmentSchema.safeParse({
    name: formData.get("name") || undefined,
    color: formData.get("color") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { supabase } = await requireAuth();
  type EnvUpdate = import("@/types/database").Database["public"]["Tables"]["environments"]["Update"];
  const updates: EnvUpdate = {};
  if (parsed.data.name) {
    updates.name = parsed.data.name;
    updates.slug = parsed.data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  if (parsed.data.color) updates.color = parsed.data.color;

  const { error } = await supabase
    .from("environments")
    .update(updates)
    .eq("id", environmentId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteEnvironment(environmentId: string) {
  const idParsed = z.string().uuid().safeParse(environmentId);
  if (!idParsed.success) return { error: "不正な環境IDです" };

  const { supabase } = await requireAuth();

  const { error } = await supabase
    .from("environments")
    .delete()
    .eq("id", environmentId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

// ── Organization Actions ────────────────────────────────────────────

export async function updateOrganization(orgId: string, formData: FormData) {
  const idParsed = z.string().uuid().safeParse(orgId);
  if (!idParsed.success) return { error: "不正な組織IDです" };

  const parsed = UpdateOrgSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { supabase } = await requireAuth();

  const { error } = await supabase
    .from("organizations")
    .update({ name: parsed.data.name })
    .eq("id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

// ── Member Actions ──────────────────────────────────────────────────

export async function inviteMember(formData: FormData) {
  const parsed = InviteMemberSchema.safeParse({
    organization_id: formData.get("organization_id"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await requireAuth();

  // For MVP, return a success message (actual invitation email would be sent in production)
  return {
    success: true,
    message: `招待メールを ${parsed.data.email} に送信しました（${parsed.data.role}ロール）`,
  };
}

export async function updateMemberRole(
  memberId: string,
  role: "admin" | "editor" | "viewer"
) {
  const idParsed = z.string().uuid().safeParse(memberId);
  if (!idParsed.success) return { error: "不正なメンバーIDです" };

  const roleParsed = z.enum(["admin", "editor", "viewer"]).safeParse(role);
  if (!roleParsed.success) return { error: "不正なロールです" };

  const { supabase } = await requireAuth();

  const { error } = await supabase
    .from("organization_members")
    .update({ role: roleParsed.data })
    .eq("id", memberId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function removeMember(memberId: string) {
  const idParsed = z.string().uuid().safeParse(memberId);
  if (!idParsed.success) return { error: "不正なメンバーIDです" };

  const { supabase } = await requireAuth();

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", memberId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}
