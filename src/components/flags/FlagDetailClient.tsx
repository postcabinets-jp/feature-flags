"use client";

import { useState, useTransition } from "react";
import {
  toggleFlag,
  updateRolloutPercent,
  updateDefaultValue,
  killSwitchFlag,
  archiveFlag,
  deleteFlag,
} from "@/app/actions/flags";
import type { Database, Json } from "@/types/database";

type Flag = Database["public"]["Tables"]["feature_flags"]["Row"];
type Environment = Database["public"]["Tables"]["environments"]["Row"];
type FlagConfig = Database["public"]["Tables"]["flag_configurations"]["Row"];
type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];

interface FlagDetailClientProps {
  flag: Flag;
  environments: Environment[];
  configs: FlagConfig[];
  orgSlug: string;
  projectSlug: string;
  canEdit: boolean;
  auditLogs: AuditLog[];
}

function getConfigForEnv(configs: FlagConfig[], envId: string) {
  return configs.find((c) => c.environment_id === envId);
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    "flag.created": "作成",
    "flag.enabled": "有効化",
    "flag.disabled": "無効化",
    "flag.targeting_updated": "ターゲティング更新",
    "flag.archived": "アーカイブ",
    "flag.deleted": "削除",
    "flag.kill_switch": "キルスイッチ",
    "flag.details_updated": "詳細更新",
  };
  return labels[action] ?? action;
}

export default function FlagDetailClient({
  flag,
  environments,
  configs,
  orgSlug,
  projectSlug,
  canEdit,
  auditLogs,
}: FlagDetailClientProps) {
  const [, startTransition] = useTransition();
  const [pendingEnvs, setPendingEnvs] = useState<Set<string>>(new Set());
  const [localConfigs, setLocalConfigs] = useState<FlagConfig[]>(configs);
  const [rolloutValues, setRolloutValues] = useState<Record<string, number>>(
    Object.fromEntries(configs.map((c) => [c.environment_id, c.rollout_percent ?? 100]))
  );
  const [defaultValues, setDefaultValues] = useState<Record<string, string>>(
    Object.fromEntries(configs.map((c) => [c.environment_id, JSON.stringify(c.default_value)]))
  );
  const [activeTab, setActiveTab] = useState<"config" | "history">("config");
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function handleToggle(envId: string, currentEnabled: boolean) {
    setPendingEnvs((p) => new Set(p).add(envId));
    // Optimistic update
    setLocalConfigs((prev) =>
      prev.map((c) =>
        c.environment_id === envId ? { ...c, enabled: !currentEnabled } : c
      )
    );
    startTransition(async () => {
      await toggleFlag(flag.id, envId, !currentEnabled);
      setPendingEnvs((p) => {
        const n = new Set(p);
        n.delete(envId);
        return n;
      });
    });
  }

  function handleRolloutSave(envId: string) {
    const percent = rolloutValues[envId] ?? 100;
    startTransition(async () => {
      await updateRolloutPercent(flag.id, envId, percent);
    });
  }

  function handleDefaultValueSave(envId: string) {
    const raw = defaultValues[envId] ?? "";
    startTransition(async () => {
      await updateDefaultValue(flag.id, envId, raw);
    });
  }

  async function handleKillSwitch() {
    setPendingEnvs(new Set(environments.map((e) => e.id)));
    setLocalConfigs((prev) => prev.map((c) => ({ ...c, enabled: false })));
    await killSwitchFlag(flag.id);
    setPendingEnvs(new Set());
  }

  async function handleArchive() {
    if (!confirm("このフラグをアーカイブしますか？一覧から非表示になります。")) return;
    setArchiving(true);
    await archiveFlag(flag.id);
  }

  async function handleDelete() {
    if (!confirm("このフラグを完全に削除しますか？この操作は元に戻せません。")) return;
    setDeleting(true);
    const result = await deleteFlag(flag.id);
    if (result.error) {
      setDeleting(false);
      alert(result.error);
    }
    // On success, the page will revalidate and redirect
  }

  return (
    <div>
      {/* Flag header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-gray-900 font-mono">{flag.key}</h1>
              <span className={`px-2 py-0.5 text-xs rounded font-mono font-medium ${
                flag.flag_type === "boolean" ? "bg-blue-50 text-blue-700" :
                flag.flag_type === "string" ? "bg-purple-50 text-purple-700" :
                flag.flag_type === "number" ? "bg-orange-50 text-orange-700" :
                "bg-gray-100 text-gray-700"
              }`}>
                {flag.flag_type}
              </span>
            </div>
            <p className="text-gray-600 text-sm">{flag.name}</p>
            {flag.description && (
              <p className="text-gray-500 text-sm mt-1">{flag.description}</p>
            )}
            {flag.tags?.length > 0 && (
              <div className="flex gap-1 mt-2">
                {flag.tags.map((t) => (
                  <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleKillSwitch}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                キルスイッチ
              </button>
              <button
                onClick={handleArchive}
                disabled={archiving}
                className="px-3 py-1.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                アーカイブ
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {deleting ? "削除中..." : "削除"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {[
          { id: "config", label: "環境設定" },
          { id: "history", label: "変更履歴" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "config" | "history")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "config" && (
        <div className="space-y-4">
          {environments.map((env) => {
            const config = getConfigForEnv(localConfigs, env.id);
            const isPending = pendingEnvs.has(env.id);

            return (
              <div key={env.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: env.color }}
                    />
                    <h3 className="font-semibold text-gray-900">{env.name}</h3>
                    <span className="text-xs text-gray-400 font-mono">{env.sdk_key.slice(0, 16)}...</span>
                  </div>

                  {canEdit && config && (
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${config.enabled ? "text-green-600" : "text-gray-400"}`}>
                        {config.enabled ? "有効" : "無効"}
                      </span>
                      <button
                        type="button"
                        onClick={() => !isPending && handleToggle(env.id, config.enabled)}
                        disabled={isPending}
                        className={`relative flex-shrink-0 transition-colors disabled:opacity-50 ${
                          config.enabled ? "bg-green-500" : "bg-gray-200"
                        } rounded-full`}
                        style={{ width: 40, height: 22 }}
                      >
                        <span
                          className="absolute top-0.5 bg-white rounded-full shadow transition-transform"
                          style={{
                            width: 18,
                            height: 18,
                            left: 2,
                            transform: config.enabled ? "translateX(18px)" : "translateX(0)",
                          }}
                        />
                      </button>
                    </div>
                  )}
                </div>

                {config ? (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Default value */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">
                        デフォルト値
                      </label>
                      {canEdit ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={defaultValues[env.id] ?? ""}
                            onChange={(e) =>
                              setDefaultValues((p) => ({ ...p, [env.id]: e.target.value }))
                            }
                            className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gray-900"
                          />
                          <button
                            onClick={() => handleDefaultValueSave(env.id)}
                            className="px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            保存
                          </button>
                        </div>
                      ) : (
                        <code className="text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded">
                          {JSON.stringify(config.default_value)}
                        </code>
                      )}
                    </div>

                    {/* Rollout */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">
                        ロールアウト %
                      </label>
                      {canEdit ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={rolloutValues[env.id] ?? 100}
                            onChange={(e) =>
                              setRolloutValues((p) => ({ ...p, [env.id]: Number(e.target.value) }))
                            }
                            className="flex-1 accent-gray-900"
                          />
                          <span className="text-sm text-gray-700 w-10 text-right">
                            {rolloutValues[env.id] ?? 100}%
                          </span>
                          <button
                            onClick={() => handleRolloutSave(env.id)}
                            className="px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            保存
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{ width: `${config.rollout_percent ?? 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-700">{config.rollout_percent ?? 100}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">この環境の設定が存在しません</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {auditLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">変更履歴がありません</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {auditLogs.map((log) => (
                <div key={log.id} className="px-5 py-3 flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                    log.action.includes("enabled") ? "bg-green-500" :
                    log.action.includes("disabled") || log.action.includes("kill") ? "bg-red-500" : "bg-blue-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {actionLabel(log.action)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(log.created_at).toLocaleString("ja-JP")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
