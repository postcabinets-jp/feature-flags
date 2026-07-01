"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";

type FlagInsert = Database["public"]["Tables"]["feature_flags"]["Insert"];
type FlagConfigUpdate = Database["public"]["Tables"]["flag_configurations"]["Update"];

export async function createFlag(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const projectId = formData.get("project_id") as string;
  const key = formData.get("key") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const flagType = formData.get("flag_type") as FlagInsert["flag_type"];
  const tagsRaw = formData.get("tags") as string;
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

  // Validate key format
  if (!/^[a-z0-9-_]+$/.test(key)) {
    return { error: "フラグキーは小文字英数字・ハイフン・アンダースコアのみ使用可能です" };
  }

  const { data, error } = await supabase
    .from("feature_flags")
    .insert({
      project_id: projectId,
      key,
      name,
      description: description || null,
      flag_type: flagType,
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
    .eq("project_id", projectId);

  if (environments?.length && data) {
    const defaultValue = flagType === "boolean" ? "false" :
      flagType === "number" ? "0" :
      flagType === "string" ? '""' : "{}";

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

  revalidatePath(`/dashboard`);
  return { data };
}

export async function updateFlagConfig(
  flagId: string,
  environmentId: string,
  updates: Partial<FlagConfigUpdate>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: existing } = await supabase
    .from("flag_configurations")
    .select("*")
    .eq("flag_id", flagId)
    .eq("environment_id", environmentId)
    .single();

  const { error } = await supabase
    .from("flag_configurations")
    .upsert({
      flag_id: flagId,
      environment_id: environmentId,
      ...updates,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });

  if (error) return { error: error.message };

  // Write audit log
  const { data: flag } = await supabase
    .from("feature_flags")
    .select("project_id, key")
    .eq("id", flagId)
    .single();

  if (flag) {
    const { data: project } = await supabase
      .from("projects")
      .select("organization_id")
      .eq("id", flag.project_id)
      .single();

    if (project) {
      const action = updates.enabled !== undefined
        ? updates.enabled ? "flag.enabled" : "flag.disabled"
        : "flag.targeting_updated";

      await supabase.from("audit_logs").insert({
        organization_id: project.organization_id,
        project_id: flag.project_id,
        flag_id: flagId,
        environment_id: environmentId,
        actor_id: user.id,
        action,
        old_value: existing as unknown as Json,
        new_value: updates as unknown as Json,
      });
    }
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleFlag(flagId: string, environmentId: string, enabled: boolean) {
  return updateFlagConfig(flagId, environmentId, { enabled });
}

export async function killSwitchFlag(flagId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: configs } = await supabase
    .from("flag_configurations")
    .select("environment_id")
    .eq("flag_id", flagId);

  if (!configs) return { error: "Not found" };

  for (const config of configs) {
    await updateFlagConfig(flagId, config.environment_id, { enabled: false });
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function archiveFlag(flagId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("feature_flags")
    .update({ archived: true })
    .eq("id", flagId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteFlag(flagId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("feature_flags")
    .delete()
    .eq("id", flagId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateFlagDetails(flagId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const tagsRaw = formData.get("tags") as string;
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const { error } = await supabase
    .from("feature_flags")
    .update({ name, description: description || null, tags })
    .eq("id", flagId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}
