"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<{ error?: string; success?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setStatus(null);
    const result = await resetPassword(formData);
    setStatus(result);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-900">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">FF</span>
            </div>
            <span className="font-semibold text-lg">feature-flags</span>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">パスワードをリセット</h1>
          <p className="text-sm text-gray-500 mb-6">
            登録したメールアドレスにリセットリンクを送信します。
          </p>

          {status?.success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {status.success}
            </div>
          )}

          {status?.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {status.error}
            </div>
          )}

          <form action={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loading ? "送信中..." : "リセットリンクを送信"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            <Link href="/login" className="text-gray-900 font-medium hover:underline">
              ログインに戻る
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
