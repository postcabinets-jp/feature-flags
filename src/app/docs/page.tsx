import Link from "next/link";

const SDK_EXAMPLES: Record<string, { lang: string; code: string }> = {
  nodejs: {
    lang: "typescript",
    code: `import FeatureFlags from '@feature-flags/node-sdk';

const client = new FeatureFlags({
  sdkKey: process.env.FF_SDK_KEY,
  // Optional: stream for real-time updates
  streaming: true,
});

await client.waitForInitialization();

// Boolean flag
const isEnabled = await client.variation(
  'new-payment-flow',
  { userId: 'usr_abc123', plan: 'pro' },
  false // default
);

// String flag (A/B test)
const buttonCopy = await client.variation(
  'checkout-button-copy',
  { userId: 'usr_abc123' },
  'Buy Now'
);

// Number flag
const maxItems = await client.variation(
  'max-items-per-cart',
  { userId: 'usr_abc123' },
  50
);`,
  },
  python: {
    lang: "python",
    code: `import feature_flags

client = feature_flags.Client(
    sdk_key=os.environ['FF_SDK_KEY']
)
client.initialize()

# Boolean flag
is_enabled = client.variation(
    'new-payment-flow',
    {'user_id': 'usr_abc123', 'plan': 'pro'},
    False  # default
)

if is_enabled:
    return render_new_checkout()`,
  },
  react: {
    lang: "tsx",
    code: `import { FeatureFlagsProvider, useFlag } from '@feature-flags/react';

// Wrap your app
function App() {
  return (
    <FeatureFlagsProvider
      sdkKey={process.env.NEXT_PUBLIC_FF_SDK_KEY}
      context={{ userId: user.id, plan: user.plan }}
    >
      <YourApp />
    </FeatureFlagsProvider>
  );
}

// Use in components
function Checkout() {
  const newFlow = useFlag('new-payment-flow', false);

  if (newFlow) {
    return <NewCheckoutFlow />;
  }
  return <LegacyCheckout />;
}`,
  },
  curl: {
    lang: "bash",
    code: `# Evaluate a flag via REST API
curl -X POST https://your-domain.com/api/v1/flags/evaluate \\
  -H "Authorization: Bearer ff_live_your_sdk_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "flag_key": "new-payment-flow",
    "context": {
      "userId": "usr_abc123",
      "plan": "pro"
    }
  }'

# Response:
# { "value": true, "reason": "TARGETING_RULE_MATCH" }`,
  },
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">FF</span>
            </div>
            <span className="font-semibold text-gray-900">feature-flags</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-gray-500 hover:text-gray-900">ログイン</Link>
            <Link href="/register" className="bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700 transition-colors">
              無料で始める
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">SDK統合ガイド</h1>
          <p className="text-gray-500">各言語・フレームワーク向けのSDK統合方法</p>
        </div>

        {/* Quick setup */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-10">
          <h2 className="font-semibold text-gray-900 mb-4">クイックスタート</h2>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs shrink-0">1</span>
              <span><Link href="/register" className="text-blue-600 hover:underline">アカウント登録</Link> → 組織とプロジェクトを作成</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs shrink-0">2</span>
              <span>プロジェクト → 環境 → SDK キーをコピー</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs shrink-0">3</span>
              <span>使用言語のSDKをインストール（下記参照）</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs shrink-0">4</span>
              <span>フラグを作成してコードで評価</span>
            </li>
          </ol>
        </div>

        {/* SDK examples */}
        <div className="space-y-8">
          {Object.entries(SDK_EXAMPLES).map(([name, example]) => (
            <div key={name}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-semibold text-gray-900 capitalize">
                  {name === "nodejs" ? "Node.js / TypeScript" :
                   name === "python" ? "Python" :
                   name === "react" ? "React / Next.js" :
                   "REST API (cURL)"}
                </h3>
                {name === "nodejs" && (
                  <code className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    npm install @feature-flags/node-sdk
                  </code>
                )}
                {name === "python" && (
                  <code className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    pip install feature-flags-sdk
                  </code>
                )}
                {name === "react" && (
                  <code className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    npm install @feature-flags/react
                  </code>
                )}
              </div>
              <div className="rounded-xl bg-gray-950 border border-gray-800 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-xs text-gray-500 ml-1">{example.lang}</span>
                </div>
                <pre className="px-4 py-4 text-sm text-gray-300 overflow-x-auto leading-relaxed font-mono">
                  <code>{example.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* REST API reference */}
        <div className="mt-12 border-t border-gray-100 pt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">REST API リファレンス</h2>

          <div className="space-y-4">
            {[
              {
                method: "GET",
                path: "/api/v1/flags",
                desc: "プロジェクト内のフラグ一覧を取得",
                auth: "SDK Key",
              },
              {
                method: "POST",
                path: "/api/v1/flags/evaluate",
                desc: "コンテキストに基づいてフラグを評価",
                auth: "SDK Key",
              },
              {
                method: "POST",
                path: "/api/v1/flags",
                desc: "新規フラグを作成",
                auth: "Management Key",
              },
              {
                method: "PATCH",
                path: "/api/v1/flags/:key/environments/:env",
                desc: "環境設定を更新（有効/無効、ルール）",
                auth: "Management Key",
              },
            ].map((endpoint) => (
              <div key={endpoint.path} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded shrink-0 ${
                  endpoint.method === "GET" ? "bg-blue-100 text-blue-700" :
                  endpoint.method === "POST" ? "bg-green-100 text-green-700" :
                  "bg-orange-100 text-orange-700"
                }`}>
                  {endpoint.method}
                </span>
                <div className="flex-1">
                  <code className="text-sm font-mono text-gray-900">{endpoint.path}</code>
                  <p className="text-xs text-gray-500 mt-0.5">{endpoint.desc}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{endpoint.auth}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
