import Link from "next/link";

function CodeBlock({ code, lang = "typescript" }: { code: string; lang?: string }) {
  return (
    <div className="rounded-xl bg-gray-950 border border-gray-800 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <span className="text-xs text-gray-500 ml-1">{lang}</span>
      </div>
      <pre className="px-4 py-4 text-sm text-gray-300 overflow-x-auto leading-relaxed font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const nodeCode = `import FeatureFlags from '@feature-flags/node-sdk';

const client = new FeatureFlags({
  sdkKey: process.env.FF_SDK_KEY,
});

const enabled = await client.variation(
  'new-payment-flow',
  { userId: 'usr_abc123', plan: 'pro' },
  false // default
);

if (enabled) {
  return renderNewCheckout();
}`;

const dockerCode = `# docker-compose.yml
version: '3.8'
services:
  feature-flags:
    image: ghcr.io/postcabinets-jp/feature-flags:latest
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://...
      NEXTAUTH_SECRET: ...

# Deploy in 60 seconds
$ docker compose up -d`;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">FF</span>
            </div>
            <span className="font-semibold text-gray-900">feature-flags</span>
            <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded font-mono">OSS</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-500">
            <Link href="/docs" className="hover:text-gray-900 transition-colors">Docs</Link>
            <a href="https://github.com/postcabinets-jp/feature-flags" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">GitHub</a>
            <Link href="/login" className="text-gray-700 hover:text-gray-900 transition-colors">ログイン</Link>
            <Link href="/register" className="bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700 transition-colors">
              無料で始める
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            LaunchDarkly の年間 $71,847 を、$15/月のVPSコストに
          </div>

          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
            フィーチャーフラグ管理を<br />
            <span className="text-gray-500">自分のサーバーで動かす</span>
          </h1>

          <p className="text-lg text-gray-500 mb-10 leading-relaxed">
            LaunchDarklyのOSS代替。Boolean / String / Number / JSONの4型、<br />
            環境別ロールアウト、フラグ腐敗検出、監査ログを完備。
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/register"
              className="bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors"
            >
              クラウド版を無料で始める
            </Link>
            <a
              href="https://github.com/postcabinets-jp/feature-flags"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub でスターを付ける
            </a>
          </div>

          <p className="mt-4 text-sm text-gray-400">
            Docker Composeで60秒デプロイ。クレカ不要。MIT License。
          </p>
        </div>
      </section>

      {/* Code demo */}
      <section className="bg-gray-50 border-y border-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                SDK統合（Node.js）
              </div>
              <CodeBlock code={nodeCode} lang="typescript" />
              <p className="mt-3 text-sm text-gray-500">
                React・Vue・iOS・Android・Go・Pythonなど9言語対応。
                WebSocketでリアルタイムフラグ配信。
              </p>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                セルフホスト（Docker）
              </div>
              <CodeBlock code={dockerCode} lang="yaml" />
              <p className="mt-3 text-sm text-gray-500">
                VPSやECSで完全セルフホスト可能。LaunchDarklyのような
                ベンダー障害依存がゼロ。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            LaunchDarklyから移行する理由
          </h2>
          <p className="text-gray-500">コスト・コントロール・腐敗フラグ管理の3点で明確に差別化</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "予測可能なコスト",
              desc: "MAU課金なし。API呼び出し数ベースで請求が読めない事態が起きない。51%のチームが経験する「予想外の請求」ゼロ。",
              stat: "$0",
              statDesc: "セルフホスト月額コスト",
              color: "bg-emerald-50 border-emerald-100",
              iconColor: "text-emerald-600",
            },
            {
              title: "フラグ腐敗の自動検出",
              desc: "60日以上変更なし・Gitコードに存在しないフラグを自動スキャン。Slack・GitHub通知付き。LaunchDarklyにはないプロアクティブな品質管理。",
              stat: "60d",
              statDesc: "超えると自動アラート",
              color: "bg-amber-50 border-amber-100",
              iconColor: "text-amber-600",
            },
            {
              title: "完全なデータ支配",
              desc: "Supabase + Docker Composeで自社インフラに。フラグデータが外部に出ない。GDPRや金融規制対応のチームに最適。",
              stat: "100%",
              statDesc: "データの自社管理",
              color: "bg-blue-50 border-blue-100",
              iconColor: "text-blue-600",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className={`border rounded-2xl p-6 ${feature.color}`}
            >
              <div className={`text-3xl font-bold mb-1 ${feature.iconColor}`}>{feature.stat}</div>
              <div className="text-xs text-gray-500 mb-4">{feature.statDesc}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature checklist */}
      <section className="bg-gray-950 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">
                必要な機能がすべて揃っている
              </h2>
              <p className="text-gray-400 mb-8">
                LaunchDarkly Foundation ($1,000+/月) で提供される主要機能を
                オープンソースで完全再現。
              </p>

              <div className="space-y-3">
                {[
                  "Boolean / String / Number / JSON の4型フラグ",
                  "Development / Staging / Production 環境管理",
                  "ユーザー属性ベースのターゲティングルール",
                  "段階的ロールアウト（%ロールアウト）",
                  "ワンクリック緊急キルスイッチ",
                  "REST API + Webhook",
                  "監査ログ（誰が・いつ・何を変更）",
                  "フラグ腐敗スキャナー（自動通知）",
                  "APIキー管理（SDK / Management 分離）",
                  "チーム権限管理（Owner / Admin / Editor / Viewer）",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <svg className="w-4 h-4 text-green-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden border border-gray-800">
                <div className="bg-gray-900 px-4 py-3 border-b border-gray-800">
                  <span className="text-sm font-medium text-gray-300">コスト比較（20人チーム・100K MAU）</span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-800">
                      <th className="text-left px-4 py-2.5">サービス</th>
                      <th className="text-right px-4 py-2.5">月額</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {[
                      { name: "LaunchDarkly Foundation", price: "$1,100+", highlight: false },
                      { name: "Statsig Pro", price: "$150+", highlight: false },
                      { name: "ConfigCat Smart", price: "$325", highlight: false },
                      { name: "feature-flags (セルフホスト)", price: "$0*", highlight: true },
                      { name: "feature-flags (クラウド版)", price: "$39〜", highlight: false },
                    ].map((row) => (
                      <tr key={row.name} className={row.highlight ? "bg-green-950/30" : ""}>
                        <td className="px-4 py-2.5 text-sm text-gray-300">{row.name}</td>
                        <td className={`px-4 py-2.5 text-sm text-right font-medium ${row.highlight ? "text-green-400" : "text-gray-400"}`}>
                          {row.price}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-2 text-xs text-gray-600 border-t border-gray-800">
                  * VPS費用（~$15/月）を除く
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Self-host CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="border border-gray-200 rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            今すぐ自分のインフラにデプロイ
          </h2>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto">
            Vercel + Supabase でクラウド版を無料起動、またはDocker Composeで自社VPSに。
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a
              href="https://vercel.com/new/clone?repository-url=https://github.com/postcabinets-jp/feature-flags"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L24 22H0L12 1z" />
              </svg>
              Deploy with Vercel
            </a>
            <Link
              href="/register"
              className="border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              クラウド版を試す（無料）
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-900 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">FF</span>
            </div>
            <span>feature-flags — MIT License</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/postcabinets-jp/feature-flags" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">
              GitHub
            </a>
            <Link href="/docs" className="hover:text-gray-600 transition-colors">Docs</Link>
            <span>Built by <a href="https://postcabinets.co.jp" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">POST CABINETS</a></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
