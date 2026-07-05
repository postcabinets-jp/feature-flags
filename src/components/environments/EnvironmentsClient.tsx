"use client";

import { useState, useTransition } from "react";
import { createEnvironment, deleteEnvironment } from "@/app/actions/organizations";
import type { Database } from "@/types/database";

type Environment = Database["public"]["Tables"]["environments"]["Row"];

interface EnvironmentsClientProps {
  environments: Environment[];
  projectId: string;
  canAdmin: boolean;
}

const PRESET_COLORS = [
  "#22c55e", "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6", "#0ea5e9", "#ec4899",
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      title="コピー"
    >
      {copied ? (
        <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

export default function EnvironmentsClient({
  environments,
  projectId,
  canAdmin,
}: EnvironmentsClientProps) {
  const [showNew, setShowNew] = useState(false);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSdkKeys, setShowSdkKeys] = useState<Record<string, boolean>>({});
  const [, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("color", selectedColor);
    const result = await createEnvironment(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setShowNew(false);
      setLoading(false);
    }
  }

  function handleDelete(envId: string, envName: string) {
    if (!confirm(`環境「${envName}」を削除しますか？この操作は元に戻せません。`)) return;
    startTransition(async () => {
      await deleteEnvironment(envId);
    });
  }

  function toggleSdkKey(envId: string) {
    setShowSdkKeys((prev) => ({ ...prev, [envId]: !prev[envId] }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">環境</h2>
        {canAdmin && (
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            環境を追加
          </button>
        )}
      </div>

      <div className="space-y-3">
        {environments.map((env) => (
          <div key={env.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: env.color }}
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{env.name}</h3>
                  <span className="text-xs text-gray-400 font-mono">{env.slug}</span>
                </div>
              </div>

              {canAdmin && (
                <button
                  onClick={() => handleDelete(env.id, env.name)}
                  className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  title="環境を削除"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">SDK キー</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 overflow-hidden text-ellipsis">
                    {showSdkKeys[env.id] ? env.sdk_key : `${env.sdk_key.slice(0, 16)}${"•".repeat(20)}`}
                  </code>
                  <button
                    onClick={() => toggleSdkKey(env.id)}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors text-xs"
                  >
                    {showSdkKeys[env.id] ? "隠す" : "表示"}
                  </button>
                  <CopyButton text={env.sdk_key} />
                </div>
              </div>

              <div className="text-xs text-gray-500">
                作成: {new Date(env.created_at).toLocaleDateString("ja-JP")}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New environment dialog */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowNew(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">環境を追加</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form action={handleSubmit} className="space-y-4">
              <input type="hidden" name="project_id" value={projectId} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  環境名
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="QA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  カラー
                </label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        selectedColor === color ? "scale-125 ring-2 ring-offset-1 ring-gray-400" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNew(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
                >
                  {loading ? "作成中..." : "作成"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
