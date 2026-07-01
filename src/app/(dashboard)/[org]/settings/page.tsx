import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ org: string }>;
}

export default async function OrgSettingsPage({ params }: PageProps) {
  const { org: orgSlug } = await params;

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

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", user.id)
    .single();

  if (!["owner", "admin"].includes(membership?.role ?? "")) {
    redirect("/dashboard");
  }

  const { data: members } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", org.id);

  const { data: apiKeys } = await supabase
    .from("api_keys")
    .select("*")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link>
        <span>/</span>
        <span className="text-gray-900">設定</span>
      </nav>

      <h1 className="text-xl font-bold text-gray-900 mb-6">組織設定</h1>

      {/* Basic settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">基本情報</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">組織名</label>
            <input
              type="text"
              defaultValue={org.name}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">スラッグ</label>
            <input
              type="text"
              defaultValue={org.slug}
              disabled
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 font-mono"
            />
            <p className="mt-1 text-xs text-gray-400">スラッグは変更できません</p>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">メンバー ({members?.length ?? 0})</h2>
          <button className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            招待
          </button>
        </div>

        <div className="space-y-2">
          {members?.map((member) => (
            <div key={member.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xs text-gray-600">U</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {member.user_id.slice(0, 8)}...
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(member.created_at).toLocaleDateString("ja-JP")} 参加
                  </div>
                </div>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                member.role === "owner" ? "bg-gray-900 text-white" :
                member.role === "admin" ? "bg-gray-700 text-white" :
                member.role === "editor" ? "bg-blue-50 text-blue-700" :
                "bg-gray-100 text-gray-600"
              }`}>
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">APIキー</h2>
          <Link
            href={`/${orgSlug}/settings/api-keys`}
            className="text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            キーを管理
          </Link>
        </div>

        {apiKeys && apiKeys.length > 0 ? (
          <div className="space-y-2">
            {apiKeys.map((key) => (
              <div key={key.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-sm font-medium text-gray-900">{key.name}</div>
                  <div className="text-xs font-mono text-gray-400">{key.key_prefix}...</div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-medium ${key.revoked_at ? "text-red-500" : "text-green-600"}`}>
                    {key.revoked_at ? "失効" : "有効"}
                  </div>
                  {key.last_used_at && (
                    <div className="text-xs text-gray-400">
                      最終使用: {new Date(key.last_used_at).toLocaleDateString("ja-JP")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">APIキーがありません</p>
        )}
      </div>
    </div>
  );
}
