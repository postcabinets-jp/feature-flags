import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NewProjectDialog from "@/components/dashboard/NewProjectDialog";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organizations(id, name, slug), role")
    .eq("user_id", user.id);

  const orgs = memberships?.map((m) => m.organizations).filter(Boolean) ?? [];

  if (orgs.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">組織が見つかりません</h2>
        <p className="text-gray-500 text-sm mb-6">招待を受け入れるか、新しい組織を作成してください。</p>
      </div>
    );
  }

  const currentOrg = orgs[0]!;

  // Get projects for current org
  const { data: projects } = await supabase
    .from("projects")
    .select("*, environments(count)")
    .eq("organization_id", currentOrg.id)
    .order("created_at", { ascending: false });

  // Get recent flag changes
  const { data: recentFlags } = await supabase
    .from("audit_logs")
    .select("*, feature_flags(key, name), environments(name)")
    .eq("organization_id", currentOrg.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Get stale flag count
  const { count: staleCount } = await supabase
    .from("flag_staleness_reports")
    .select("id", { count: "exact", head: true })
    .is("resolved_at", null);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{currentOrg.name}</h1>
          <p className="text-gray-500 text-sm mt-1">フィーチャーフラグ管理</p>
        </div>
        <NewProjectDialog orgId={currentOrg.id} />
      </div>

      {/* Stale flag warning */}
      {staleCount && staleCount > 0 ? (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">
              {staleCount}件のフラグが腐敗している可能性があります
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              60日以上変更のないフラグ、またはコードベースに存在しないフラグが検出されました。
            </p>
          </div>
        </div>
      ) : null}

      {/* Projects Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {projects?.map((project) => (
          <Link
            key={project.id}
            href={`/${currentOrg.slug}/${project.slug}`}
            className="group block bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
            {project.description && (
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.description}</p>
            )}
            <div className="text-xs text-gray-400">
              {new Date(project.created_at).toLocaleDateString("ja-JP")} 作成
            </div>
          </Link>
        ))}

        {(!projects || projects.length === 0) && (
          <div className="col-span-3 text-center py-12 bg-white border border-dashed border-gray-300 rounded-xl">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p className="text-gray-500 text-sm mb-1">プロジェクトがありません</p>
            <p className="text-gray-400 text-xs">右上の「新規プロジェクト」から作成できます</p>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {recentFlags && recentFlags.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm">最近のアクティビティ</h2>
          <div className="space-y-3">
            {recentFlags.map((log) => (
              <div key={log.id} className="flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  log.action.includes("enabled") ? "bg-green-500" :
                  log.action.includes("disabled") ? "bg-red-500" : "bg-blue-500"
                }`} />
                <div className="flex-1 min-w-0">
                  <span className="text-gray-900 font-medium">
                    {(log.feature_flags as {key?: string; name?: string} | null)?.key || ""}
                  </span>
                  <span className="text-gray-500 mx-1">が</span>
                  <span className="text-gray-700">
                    {log.action === "flag.enabled" ? "有効化" :
                     log.action === "flag.disabled" ? "無効化" :
                     log.action === "flag.created" ? "作成" : "更新"}
                  </span>
                  <span className="text-gray-400 ml-2 text-xs">
                    {new Date(log.created_at).toLocaleString("ja-JP")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
