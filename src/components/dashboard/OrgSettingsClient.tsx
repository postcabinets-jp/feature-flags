"use client";

import { useState, useTransition } from "react";
import { updateOrganization, updateMemberRole, removeMember } from "@/app/actions/organizations";
import type { Database } from "@/types/database";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type Member = Database["public"]["Tables"]["organization_members"]["Row"];
type ApiKey = Database["public"]["Tables"]["api_keys"]["Row"];

interface OrgSettingsClientProps {
  org: Organization;
  members: Member[];
  apiKeys: ApiKey[];
  orgSlug: string;
}

export default function OrgSettingsClient({
  org,
  members,
  apiKeys,
  orgSlug,
}: OrgSettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [orgName, setOrgName] = useState(org.name);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  function handleSaveOrg() {
    const fd = new FormData();
    fd.set("name", orgName);
    startTransition(async () => {
      const result = await updateOrganization(org.id, fd);
      if (result.error) {
        setSaveMsg(result.error);
      } else {
        setSaveMsg("保存しました");
        setTimeout(() => setSaveMsg(null), 2000);
      }
    });
  }

  function handleRoleChange(memberId: string, newRole: "admin" | "editor" | "viewer") {
    startTransition(async () => {
      await updateMemberRole(memberId, newRole);
    });
  }

  function handleRemoveMember(memberId: string) {
    if (!confirm("このメンバーを削除しますか？")) return;
    startTransition(async () => {
      await removeMember(memberId);
    });
  }

  return (
    <>
      {/* Basic settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">基本情報</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">組織名</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <button
                onClick={handleSaveOrg}
                disabled={isPending || orgName === org.name}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                保存
              </button>
            </div>
            {saveMsg && (
              <p className={`mt-1 text-xs ${saveMsg === "保存しました" ? "text-green-600" : "text-red-600"}`}>
                {saveMsg}
              </p>
            )}
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
          <h2 className="font-semibold text-gray-900">メンバー ({members.length})</h2>
        </div>

        <div className="space-y-2">
          {members.map((member) => (
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
              <div className="flex items-center gap-2">
                {member.role === "owner" ? (
                  <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-gray-900 text-white">
                    owner
                  </span>
                ) : (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleRoleChange(
                          member.id,
                          e.target.value as "admin" | "editor" | "viewer"
                        )
                      }
                      disabled={isPending}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    >
                      <option value="admin">admin</option>
                      <option value="editor">editor</option>
                      <option value="viewer">viewer</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={isPending}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="メンバーを削除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">APIキー</h2>
        </div>

        {apiKeys.length > 0 ? (
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
    </>
  );
}
