import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ org: string; project: string }>;
  searchParams: Promise<{ env?: string; action?: string; from?: string; to?: string }>;
}

const ACTION_LABELS: Record<string, string> = {
  "flag.created": "作成",
  "flag.enabled": "有効化",
  "flag.disabled": "無効化",
  "flag.targeting_updated": "ターゲティング更新",
  "flag.archived": "アーカイブ",
};

export default async function AuditPage({ params, searchParams }: PageProps) {
  const { org: orgSlug, project: projectSlug } = await params;
  const { env: envFilter, action: actionFilter } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", orgSlug)
    .single();
  if (!org) notFound();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("organization_id", org.id)
    .eq("slug", projectSlug)
    .single();
  if (!project) notFound();

  const { data: environments } = await supabase
    .from("environments")
    .select("*")
    .eq("project_id", project.id);

  let query = supabase
    .from("audit_logs")
    .select("*, feature_flags(key, name), environments(name, color)")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (envFilter) {
    const env = environments?.find((e) => e.slug === envFilter);
    if (env) query = query.eq("environment_id", env.id);
  }

  if (actionFilter) {
    query = query.eq("action", actionFilter);
  }

  const { data: logs } = await query;

  return (
    <div className="max-w-5xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link>
        <span>/</span>
        <Link href={`/${orgSlug}/${projectSlug}`} className="hover:text-gray-900">{project.name}</Link>
        <span>/</span>
        <span className="text-gray-900">監査ログ</span>
      </nav>

      {/* Sub-nav */}
      <div className="flex items-center gap-1 border-b border-gray-200 mb-6 -mx-1">
        {[
          { label: "フラグ", href: `/${orgSlug}/${projectSlug}` },
          { label: "環境", href: `/${orgSlug}/${projectSlug}/environments` },
          { label: "監査ログ", href: `/${orgSlug}/${projectSlug}/audit` },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              item.href === `/${orgSlug}/${projectSlug}/audit`
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">環境:</span>
          <Link
            href={`/${orgSlug}/${projectSlug}/audit`}
            className={`px-2 py-1 text-xs rounded-full ${!envFilter ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            すべて
          </Link>
          {environments?.map((env) => (
            <Link
              key={env.id}
              href={`/${orgSlug}/${projectSlug}/audit?env=${env.slug}`}
              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                envFilter === env.slug ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={envFilter === env.slug ? { backgroundColor: env.color } : {}}
            >
              {env.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">アクション:</span>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <Link
              key={value}
              href={`/${orgSlug}/${projectSlug}/audit?action=${value}${envFilter ? `&env=${envFilter}` : ""}`}
              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                actionFilter === value ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Log table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {!logs || logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            監査ログがありません
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">日時</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">フラグ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">環境</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => {
                const env = log.environments as { name?: string; color?: string } | null;
                const flag = log.feature_flags as { key?: string; name?: string } | null;

                return (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("ja-JP")}
                    </td>
                    <td className="px-4 py-3">
                      {flag ? (
                        <div>
                          <div className="text-sm font-mono text-gray-900">{flag.key}</div>
                          <div className="text-xs text-gray-500">{flag.name}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {env ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: env.color ?? "#6366f1" }}
                        >
                          {env.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        log.action.includes("enabled") ? "bg-green-50 text-green-700" :
                        log.action.includes("disabled") ? "bg-red-50 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
