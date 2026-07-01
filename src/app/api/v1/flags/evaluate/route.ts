import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface EvaluateRequest {
  flag_key: string;
  context: Record<string, unknown>;
}

function hashContext(userId: string, flagId: string): number {
  let hash = 0;
  const str = `${userId}:${flagId}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 100;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sdkKey = authHeader.slice(7);
  const supabase = await createClient();

  // Look up environment by SDK key
  const { data: environment, error: envError } = await supabase
    .from("environments")
    .select("*")
    .eq("sdk_key", sdkKey)
    .single();

  if (envError || !environment) {
    return NextResponse.json({ error: "Invalid SDK key" }, { status: 401 });
  }

  const body = await request.json() as EvaluateRequest;
  const { flag_key, context } = body;

  if (!flag_key) {
    return NextResponse.json({ error: "flag_key is required" }, { status: 400 });
  }

  // Get flag
  const { data: flag } = await supabase
    .from("feature_flags")
    .select("*")
    .eq("project_id", environment.project_id)
    .eq("key", flag_key)
    .eq("archived", false)
    .single();

  if (!flag) {
    return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  }

  // Get configuration for this environment
  const { data: config } = await supabase
    .from("flag_configurations")
    .select("*")
    .eq("flag_id", flag.id)
    .eq("environment_id", environment.id)
    .single();

  if (!config || !config.enabled) {
    return NextResponse.json({
      value: config?.default_value ?? false,
      reason: "FLAG_DISABLED",
    });
  }

  // Check rollout percentage
  if (config.rollout_percent !== null && config.rollout_percent < 100) {
    const userId = (context.userId ?? context.user_id ?? "") as string;
    const userHash = hashContext(String(userId), flag.id);
    if (userHash >= config.rollout_percent) {
      return NextResponse.json({
        value: config.default_value,
        reason: "ROLLOUT_EXCLUDED",
      });
    }
  }

  // Check targeting rules
  const rules = Array.isArray(config.rules) ? config.rules : [];
  for (const rule of rules) {
    const r = rule as { attribute: string; operator: string; value: unknown; serve: unknown };
    const attrValue = context[r.attribute];

    let matches = false;
    if (r.operator === "equals") matches = attrValue === r.value;
    else if (r.operator === "contains" && typeof attrValue === "string") {
      matches = attrValue.includes(String(r.value));
    } else if (r.operator === "in" && Array.isArray(r.value)) {
      matches = (r.value as unknown[]).includes(attrValue);
    }

    if (matches) {
      return NextResponse.json({
        value: r.serve,
        reason: "TARGETING_RULE_MATCH",
      });
    }
  }

  return NextResponse.json({
    value: config.default_value,
    reason: "DEFAULT_VALUE",
  });
}
