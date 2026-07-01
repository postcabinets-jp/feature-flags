"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleFlag, killSwitchFlag } from "@/app/actions/flags";
import type { Database } from "@/types/database";

type Flag = Database["public"]["Tables"]["feature_flags"]["Row"] & {
  flag_configurations: Database["public"]["Tables"]["flag_configurations"]["Row"][];
};

type Environment = Database["public"]["Tables"]["environments"]["Row"];

interface FlagListProps {
  flags: Flag[];
  currentEnv: Environment | null;
  orgSlug: string;
  projectSlug: string;
  canEdit: boolean;
}

function FlagTypeBadge({ type }: { type: string }) {
  const styles = {
    boolean: "bg-blue-50 text-blue-700",
    string: "bg-purple-50 text-purple-700",
    number: "bg-orange-50 text-orange-700",
    json: "bg-gray-100 text-gray-700",
  };

  return (
    <span className={`px-1.5 py-0.5 text-xs rounded font-mono font-medium ${styles[type as keyof typeof styles] ?? styles.json}`}>
      {type}
    </span>
  );
}

function ToggleSwitch({
  enabled,
  onToggle,
  disabled,
}: {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`relative w-10 h-5.5 rounded-full transition-colors disabled:opacity-50 ${
        enabled ? "bg-green-500" : "bg-gray-200"
      }`}
      style={{ height: "22px" }}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${
          enabled ? "translate-x-4.5" : "translate-x-0"
        }`}
        style={{ width: "18px", height: "18px", transform: enabled ? "translateX(18px)" : "translateX(0)" }}
      />
    </button>
  );
}

export default function FlagList({
  flags,
  currentEnv,
  orgSlug,
  projectSlug,
  canEdit,
}: FlagListProps) {
  const [, startTransition] = useTransition();
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set());
  const [pendingKills, setPendingKills] = useState<Set<string>>(new Set());

  function getConfigForEnv(flag: Flag) {
    if (!currentEnv) return null;
    return flag.flag_configurations.find(
      (c) => c.environment_id === currentEnv.id
    );
  }

  function handleToggle(flagId: string, envId: string, currentEnabled: boolean) {
    const key = `${flagId}-${envId}`;
    setPendingToggles((prev) => new Set(prev).add(key));
    startTransition(async () => {
      await toggleFlag(flagId, envId, !currentEnabled);
      setPendingToggles((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    });
  }

  function handleKillSwitch(flagId: string) {
    setPendingKills((prev) => new Set(prev).add(flagId));
    startTransition(async () => {
      await killSwitchFlag(flagId);
      setPendingKills((prev) => {
        const next = new Set(prev);
        next.delete(flagId);
        return next;
      });
    });
  }

  if (flags.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-xl">
        <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
        <p className="text-gray-500 text-sm mb-1">フラグがありません</p>
        {canEdit && (
          <Link
            href={`/${orgSlug}/${projectSlug}/flags/new`}
            className="text-xs text-gray-900 font-medium hover:underline"
          >
            最初のフラグを作成する
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">フラグキー</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">型</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">タグ</th>
            {currentEnv && (
              <>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">状態</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">ロールアウト</th>
              </>
            )}
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {flags.map((flag) => {
            const config = getConfigForEnv(flag);
            const isTogglingKey = currentEnv ? `${flag.id}-${currentEnv.id}` : null;
            const isToggling = isTogglingKey ? pendingToggles.has(isTogglingKey) : false;
            const isKilling = pendingKills.has(flag.id);

            return (
              <tr key={flag.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/${orgSlug}/${projectSlug}/flags/${flag.key}`}
                    className="group"
                  >
                    <div className="font-mono text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                      {flag.key}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{flag.name}</div>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <FlagTypeBadge type={flag.flag_type} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {flag.tags?.slice(0, 3).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                {currentEnv && (
                  <>
                    <td className="px-4 py-3">
                      {config ? (
                        <ToggleSwitch
                          enabled={config.enabled}
                          onToggle={() =>
                            canEdit && handleToggle(flag.id, currentEnv.id, config.enabled)
                          }
                          disabled={!canEdit || isToggling}
                        />
                      ) : (
                        <span className="text-xs text-gray-400">未設定</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {config?.rollout_percent != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${config.rollout_percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{config.rollout_percent}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleKillSwitch(flag.id)}
                        disabled={isKilling}
                        title="全環境でOFFにする（キルスイッチ）"
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </button>
                    )}
                    <Link
                      href={`/${orgSlug}/${projectSlug}/flags/${flag.key}`}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
