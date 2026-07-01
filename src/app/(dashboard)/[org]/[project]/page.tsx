import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FlagList from "@/components/flags/FlagList";

interface PageProps {
  params: Promise<{ org: string; project: string }>;
  searchParams: Promise<{ env?: string; q?: string; tag?: string }>;
}

export default async function ProjectPage({ params, searchParams }: PageProps) {
  const { org: orgSlug, project: projectSlug } = await params;
  const { env: envSlug, q: query, tag } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get org
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", orgSlug)
    .single();

  if (!org) notFound();

  // Get project
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("organization_id", org.id)
    .eq("slug", projectSlug)
    .single();

  if (!project) notFound();

  // Get environments
  const { data: environments } = await supabase
    .from("environments")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at");

  const currentEnv =
    environments?.find((e) => e.slug === envSlug) ?? environments?.[0];

  // Build flag query
  let flagQuery = supabase
    .from("feature_flags")
    .select("*, flag_configurations(*)")
    .eq("project_id", project.id)
    .eq("archived", false)
    .order("created_at", { ascending: false });

  if (query) {
    flagQuery = flagQuery.or(`key.ilike.%${query}%,name.ilike.%${query}%`);
  }

  if (tag) {
    flagQuery = flagQuery.contains("tags", [tag]);
  }

  const { data: flags } = await flagQuery;

  // Get user role
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", user.id)
    .single();

  const canEdit = ["owner", "admin", "editor"].includes(membership?.role ?? "");

  // Collect all unique tags
  const allTags = [...new Set(flags?.flatMap((f) => f.tags ?? []) ?? [])];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{project.name}</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="text-gray-500 text-sm mt-0.5">{project.description}</p>
          )}
        </div>
        {canEdit && (
          <Link
            href={`/${orgSlug}/${projectSlug}/flags/new`}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            フラグを作成
          </Link>
        )}
      </div>

      {/* Project sub-nav */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200 -mx-1">
        {[
          { label: "フラグ", href: `/${orgSlug}/${projectSlug}` },
          { label: "環境", href: `/${orgSlug}/${projectSlug}/environments` },
          { label: "監査ログ", href: `/${orgSlug}/${projectSlug}/audit` },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              item.href === `/${orgSlug}/${projectSlug}`
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Environment tabs */}
      {environments && environments.length > 0 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto">
          {environments.map((env) => (
            <Link
              key={env.id}
              href={`/${orgSlug}/${projectSlug}?env=${env.slug}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                currentEnv?.id === env.id
                  ? "text-white"
                  : "text-gray-600 bg-gray-100 hover:bg-gray-200"
              }`}
              style={currentEnv?.id === env.id ? { backgroundColor: env.color } : {}}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: currentEnv?.id === env.id ? "rgba(255,255,255,0.7)" : env.color }}
              />
              {env.name}
            </Link>
          ))}
        </div>
      )}

      {/* Search and filter */}
      <div className="flex items-center gap-3 mb-4">
        <form className="flex-1">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              name="q"
              type="text"
              defaultValue={query}
              placeholder="フラグキーまたは名前で検索..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            {/* Preserve env param */}
            {envSlug && <input type="hidden" name="env" value={envSlug} />}
          </div>
        </form>

        {allTags.length > 0 && (
          <div className="flex items-center gap-1">
            {allTags.slice(0, 5).map((t) => (
              <Link
                key={t}
                href={`/${orgSlug}/${projectSlug}?${tag === t ? "" : `tag=${t}`}${envSlug ? `&env=${envSlug}` : ""}`}
                className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                  tag === t
                    ? "bg-gray-900 text-white border-gray-900"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {t}
              </Link>
            ))}
          </div>
        )}
      </div>

      <FlagList
        flags={flags ?? []}
        currentEnv={currentEnv ?? null}
        orgSlug={orgSlug}
        projectSlug={projectSlug}
        canEdit={canEdit}
      />
    </div>
  );
}
