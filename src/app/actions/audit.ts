"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// ── Schemas ──────────────────────────────────────────────────────────

const ListAuditLogsSchema = z.object({
  projectId: z.string().uuid("不正なプロジェクトIDです"),
  environmentId: z.string().uuid().optional(),
  flagId: z.string().uuid().optional(),
  action: z.string().optional(),
  limit: z.number().min(1).max(500).default(100),
  offset: z.number().min(0).default(0),
});

const FlagAuditLogsSchema = z.object({
  flagId: z.string().uuid("不正なフラグIDです"),
  limit: z.number().min(1).max(100).default(20),
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

// ── Actions ─────────────────────────────────────────────────────────

export async function listAuditLogs(params: z.infer<typeof ListAuditLogsSchema>) {
  const parsed = ListAuditLogsSchema.safeParse(params);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, data: null, total: 0 };
  }

  const { supabase } = await requireAuth();
  const { projectId, environmentId, flagId, action, limit, offset } = parsed.data;

  let query = supabase
    .from("audit_logs")
    .select("*, feature_flags(key, name), environments(name, color)", {
      count: "exact",
    })
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (environmentId) query = query.eq("environment_id", environmentId);
  if (flagId) query = query.eq("flag_id", flagId);
  if (action) query = query.eq("action", action);

  const { data, error, count } = await query;

  if (error) return { error: error.message, data: null, total: 0 };
  return { data, total: count ?? 0 };
}

export async function getFlagAuditLogs(params: z.infer<typeof FlagAuditLogsSchema>) {
  const parsed = FlagAuditLogsSchema.safeParse(params);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, data: null };
  }

  const { supabase } = await requireAuth();

  const { data, error } = await supabase
    .from("audit_logs")
    .select("*, environments(name, color)")
    .eq("flag_id", parsed.data.flagId)
    .order("created_at", { ascending: false })
    .limit(parsed.data.limit);

  if (error) return { error: error.message, data: null };
  return { data };
}
