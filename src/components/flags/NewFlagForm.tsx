"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createFlag } from "@/app/actions/flags";

interface NewFlagFormProps {
  projectId: string;
  orgSlug: string;
  projectSlug: string;
}

const FLAG_TYPES = [
  { value: "boolean", label: "Boolean", desc: "true / false の2値" },
  { value: "string", label: "String", desc: "テキスト値。A/Bテストのコピー等" },
  { value: "number", label: "Number", desc: "数値。制限値・しきい値等" },
  { value: "json", label: "JSON", desc: "複雑な設定オブジェクト" },
] as const;

export default function NewFlagForm({ projectId, orgSlug, projectSlug }: NewFlagFormProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<"boolean" | "string" | "number" | "json">("boolean");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("flag_type", selectedType);
    formData.set("project_id", projectId);
    const result = await createFlag(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/${orgSlug}/${projectSlug}`);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">フラグを作成</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">フラグタイプ</label>
          <div className="grid grid-cols-2 gap-3">
            {FLAG_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setSelectedType(type.value)}
                className={`text-left p-3 border rounded-lg transition-all ${
                  selectedType === type.value
                    ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-mono text-sm font-semibold text-gray-900 mb-0.5">
                  {type.label}
                </div>
                <div className="text-xs text-gray-500">{type.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="key" className="block text-sm font-medium text-gray-700 mb-1">
            フラグキー <span className="text-red-500">*</span>
          </label>
          <input
            id="key"
            name="key"
            type="text"
            required
            pattern="[a-z0-9\-_]+"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="new-checkout-flow"
          />
          <p className="mt-1 text-xs text-gray-400">
            小文字英数字・ハイフン・アンダースコアのみ。後から変更不可。
          </p>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            表示名 <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="New Checkout Flow"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            説明
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            placeholder="このフラグの目的、関連チケット、削除予定日など..."
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            タグ
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="payments, ux, ab-test（カンマ区切り）"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href={`/${orgSlug}/${projectSlug}`}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading ? "作成中..." : "フラグを作成"}
          </button>
        </div>
      </form>
    </div>
  );
}
