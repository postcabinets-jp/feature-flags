-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ユーザープロファイル
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 組織
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 組織メンバー
CREATE TABLE organization_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

-- プロジェクト
CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

-- 環境
CREATE TABLE environments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#6366f1',
  sdk_key     TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, slug)
);

-- フィーチャーフラグ定義
CREATE TABLE feature_flags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key             TEXT NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  flag_type       TEXT NOT NULL CHECK (flag_type IN ('boolean', 'string', 'number', 'json')),
  tags            TEXT[] DEFAULT '{}',
  archived        BOOLEAN NOT NULL DEFAULT false,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, key)
);

-- 環境ごとのフラグ設定
CREATE TABLE flag_configurations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id         UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  environment_id  UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
  enabled         BOOLEAN NOT NULL DEFAULT false,
  default_value   JSONB NOT NULL,
  rollout_percent INT CHECK (rollout_percent BETWEEN 0 AND 100),
  rules           JSONB NOT NULL DEFAULT '[]',
  updated_by      UUID REFERENCES auth.users(id),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (flag_id, environment_id)
);

-- バリアント（A/Bテスト用）
CREATE TABLE flag_variants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id     UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  key         TEXT NOT NULL,
  value       JSONB NOT NULL,
  weight      INT NOT NULL DEFAULT 0 CHECK (weight BETWEEN 0 AND 100000),
  description TEXT,
  UNIQUE (flag_id, key)
);

-- 監査ログ
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
  flag_id         UUID REFERENCES feature_flags(id) ON DELETE SET NULL,
  environment_id  UUID REFERENCES environments(id) ON DELETE SET NULL,
  actor_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  old_value       JSONB,
  new_value       JSONB,
  ip_address      INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- APIキー
CREATE TABLE api_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  key_hash        TEXT NOT NULL UNIQUE,
  key_prefix      TEXT NOT NULL,
  scopes          TEXT[] NOT NULL DEFAULT '{"flags:read"}',
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at      TIMESTAMPTZ
);

-- フラグ腐敗スキャン結果
CREATE TABLE flag_staleness_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id     UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL CHECK (reason IN ('no_code_reference', 'always_off_60d', 'always_on_60d')),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  notified    BOOLEAN NOT NULL DEFAULT false
);

-- インデックス
CREATE INDEX idx_feature_flags_project_key   ON feature_flags(project_id, key) WHERE archived = false;
CREATE INDEX idx_flag_configurations_flag     ON flag_configurations(flag_id);
CREATE INDEX idx_flag_configurations_env      ON flag_configurations(environment_id);
CREATE INDEX idx_audit_logs_org_created       ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_flag              ON audit_logs(flag_id, created_at DESC);
CREATE INDEX idx_org_members_user             ON organization_members(user_id);
CREATE INDEX idx_environments_project         ON environments(project_id);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ユーザー作成時にプロファイルを自動作成
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
