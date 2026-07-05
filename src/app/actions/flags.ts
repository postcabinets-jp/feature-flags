"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import { z } from "zod";

// ── Schemas ──────────────────────────────────────────────────────────

const FlagKeySchema = z
  .string()
  .min(1, "フラグキーは必須です")
  .regex(/^[a-z0-9-_]+$/, "小文字英数字・ハイフン・アンダースコアのみ使用可能");

const CreateFlagSchema = z.object({
  project_id: z.string().uuid("不正なプロジェクトIDです"),
  key: FlagKeySchema,
  name: z.string().min(1, "表示名は必須です").max(200),
  description: z.string().max(1000).optional().default(""),
  flag_type: z.enum(["boolean", "string", "number", "json"]),
  tags: z.string().optional().default(""),
});

const UpdateFlagDetailsSchema = z.object({
  name: z.string().min(1, "表示名は必須です").max(200),
  description: z.string().max(1000).optional().default(""),
  tags: z.string().optional().default(""),
});

const UpdateFlagConfigSchema = z.object({
  enabled: z.boolean().optional(),
  default_value: z.any().optional(),
  rollout_percent: z.number().min(0).max(100).nullable().optional(),
  rules: z.any().optional(),
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

async function writeAuditLog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    flagId: string;
    environmentId?: string;
    userId: string;
    action: string;
    oldValue?: unknown;
    newValue?: unknown;
  }
) {
  const { data: flag } = await supabase
    .from("feature_flags")
    .select("project_id")
    .eq("id", params.flagId)
    .single();
  if (!flag) return;

  const { data: project } = await supabase
    .from("projects")
    .select("organization_id")
    .eq("id", flag.project_id)
    .single();
  if (!project) return;

  await supabase.from("audit_logs").insert({
    organization_id: project.organization_id,
    project_id: flag.project_id,
    flag_id: params.flagId,
    environment_id: params.environmentId ?? null,
    actor_id: params.userId,
    action: params.action,
    old_value: (params.oldValue ?? null) as Json,
    new_value: (params.newValue ?? null) as Json,
  });
}

// ── Actions ─────────────────────────────────────────────────────────

export async function createFlag(formData: FormData) {
  const parsed = CreateFlagSchema.safeParse({
    project_id: formData.get("project_id"),
    key: formData.get("key"),
    name: formData.get("name"),
    description: formData.get("description"),
    flag_type: formData.get("flag_type"),
    tags: formData.get("tags"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { supabase, user } = await requireAuth();
  const { project_id, key, name, description, flag_type, tags: tagsRaw } = parsed.data;
  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const { data, error } = await supabase
    .from("feature_flags")
    .insert({
      project_id,
      key,
      name,
      description: description || null,
      flag_type,
      tags,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "このフラグキーはすでに存在します" };
    }
    return { error: error.message };
  }

  // Create default configs for all environments in this project
  const { data: environments } = await supabase
    .from("environments")
    .select("id")
    .eq("project_id", project_id);

  if (environments?.length && data) {
    const defaultValue =
      flag_type === "boolean"
        ? "false"
        : flag_type === "number"
          ? "0"
          : flag_type === "string"
            ? '""'
            : "{}";

    await supabase.from("flag_configurations").insert(
      environments.map((env) => ({
        flag_id: data.id,
        environment_id: env.id,
        enabled: false,
        default_value: defaultValue as Json,
        updated_by: user.id,
      }))
    );
  }

  // Audit
  if (data) {
    await writeAuditLog(supabase, {
      flagId: data.id,
      userId: user.id,
      action: "flag.created",
      newValue: { key, name, flag_type, tags },
    });
  }

  revalidatePath("/dashboard");
  return { data };
}

export async function updateFlagConfig(
  flagId: string,
  environmentId: string,
  updates: z.infer<typeof UpdateFlagConfigSchema>
) {
  const parsed = UpdateFlagConfigSchema.safeParse(updates);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { supabase, user } = await requireAuth();

  const { data: existing } = await supabase
    .from("flag_configurations")
    .select("*")
    .eq("flag_id", flagId)
    .eq("environment_id", environmentId)
    .single();

  type FlagConfigInsert = import("@/types/database").Database["public"]["Tables"]["flag_configurations"]["Insert"];
  const upsertPayload: FlagConfigInsert = {
    flag_id: flagId,
    environment_id: environmentId,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.enabled !== undefined) upsertPayload.enabled = parsed.data.enabled;
  if (parsed.data.default_value !== undefined) upsertPayload.default_value = parsed.data.default_value as Json;
  if (parsed.data.rollout_percent !== undefined) upsertPayload.rollout_percent = parsed.data.rollout_percent;
  if (parsed.data.rules !== undefined) upsertPayload.rules = parsed.data.rules as Json;

  const { error } = await supabase
    .from("flag_configurations")
    .upsert(upsertPayload);

  if (error) return { error: error.message };

  const action =
    parsed.data.enabled !== undefined
      ? parsed.data.enabled
        ? "flag.enabled"
        : "flag.disabled"
      : "flag.targeting_updated";

  await writeAuditLog(supabase, {
    flagId,
    environmentId,
    userId: user.id,
    action,
    oldValue: existing,
    newValue: parsed.data,
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleFlag(
  flagId: string,
  environmentId: string,
  enabled: boolean
) {
  const validated = z.boolean().safeParse(enabled);
  if (!validated.success) return { error: "不正な値です" };
  return updateFlagConfig(flagId, environmentId, { enabled: validated.data });
}

export async function updateRolloutPercent(
  flagId: string,
  environmentId: string,
  percent: number
) {
  const validated = z.number().min(0).max(100).safeParse(percent);
  if (!validated.success) return { error: "ロールアウト率は0〜100の範囲で指定してください" };
  return updateFlagConfig(flagId, environmentId, {
    rollout_percent: validated.data,
  });
}

export async function updateDefaultValue(
  flagId: string,
  environmentId: string,
  rawValue: string
) {
  let parsed: Json;
  try {
    parsed = JSON.parse(rawValue) as Json;
  } catch {
    parsed = rawValue;
  }
  return updateFlagConfig(flagId, environmentId, { default_value: parsed });
}

export async function killSwitchFlag(flagId: string) {
  const idParsed = z.string().uuid().safeParse(flagId);
  if (!idParsed.success) return { error: "不正なフラグIDです" };

  const { supabase, user } = await requireAuth();

  const { data: configs } = await supabase
    .from("flag_configurations")
    .select("environment_id")
    .eq("flag_id", flagId);

  if (!configs) return { error: "Not found" };

  for (const config of configs) {
    await updateFlagConfig(flagId, config.environment_id, { enabled: false });
  }

  await writeAuditLog(supabase, {
    flagId,
    userId: user.id,
    action: "flag.kill_switch",
    newValue: { all_environments_disabled: true },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function archiveFlag(flagId: string) {
  const idParsed = z.string().uuid().safeParse(flagId);
  if (!idParsed.success) return { error: "不正なフラグIDです" };

  const { supabase, user } = await requireAuth();

  const { error } = await supabase
    .from("feature_flags")
    .update({ archived: true })
    .eq("id", flagId);

  if (error) return { error: error.message };

  await writeAuditLog(supabase, {
    flagId,
    userId: user.id,
    action: "flag.archived",
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteFlag(flagId: string) {
  const idParsed = z.string().uuid().safeParse(flagId);
  if (!idParsed.success) return { error: "不正なフラグIDです" };

  const { supabase, user } = await requireAuth();

  // Audit before deletion (flag data will be gone after)
  await writeAuditLog(supabase, {
    flagId,
    userId: user.id,
    action: "flag.deleted",
  });

  const { error } = await supabase
    .from("feature_flags")
    .delete()
    .eq("id", flagId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateFlagDetails(flagId: string, formData: FormData) {
  const parsed = UpdateFlagDetailsSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    tags: formData.get("tags"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { supabase, user } = await requireAuth();
  const { name, description, tags: tagsRaw } = parsed.data;
  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const { data: oldFlag } = await supabase
    .from("feature_flags")
    .select("name, description, tags")
    .eq("id", flagId)
    .single();

  const { error } = await supabase
    .from("feature_flags")
    .update({ name, description: description || null, tags })
    .eq("id", flagId);

  if (error) return { error: error.message };

  await writeAuditLog(supabase, {
    flagId,
    userId: user.id,
    action: "flag.details_updated",
    oldValue: oldFlag,
    newValue: { name, description, tags },
  });

  revalidatePath("/dashboard");
  return { success: true };
}
