-- RLS有効化
ALTER TABLE profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects               ENABLE ROW LEVEL SECURITY;
ALTER TABLE environments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE flag_configurations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE flag_variants          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys               ENABLE ROW LEVEL SECURITY;
ALTER TABLE flag_staleness_reports ENABLE ROW LEVEL SECURITY;

-- profiles: 自分のプロファイルのみ
CREATE POLICY "profiles_self_read" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_self_update" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- organizations: メンバーのみアクセス可
CREATE POLICY "organizations_member_read" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "organizations_owner_write" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- organization_members: 同組織メンバーは閲覧可
CREATE POLICY "members_read" ON organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members_admin_write" ON organization_members
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- projects: 組織メンバーのみ
CREATE POLICY "projects_org_member" ON projects
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- environments: 組織メンバーのみ
CREATE POLICY "environments_org_member" ON environments
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "environments_admin_write" ON environments
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

-- feature_flags: 全メンバー読み取り、editor以上が書き込み
CREATE POLICY "flags_org_member_read" ON feature_flags
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "flags_editor_write" ON feature_flags
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin', 'editor')
    )
  );

-- flag_configurations: 全メンバー読み取り、editor以上が書き込み
CREATE POLICY "flag_configs_read" ON flag_configurations
  FOR SELECT USING (
    flag_id IN (
      SELECT ff.id FROM feature_flags ff
      JOIN projects p ON p.id = ff.project_id
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "flag_configs_editor_write" ON flag_configurations
  FOR ALL USING (
    flag_id IN (
      SELECT ff.id FROM feature_flags ff
      JOIN projects p ON p.id = ff.project_id
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin', 'editor')
    )
  );

-- flag_variants
CREATE POLICY "flag_variants_read" ON flag_variants
  FOR SELECT USING (
    flag_id IN (
      SELECT ff.id FROM feature_flags ff
      JOIN projects p ON p.id = ff.project_id
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "flag_variants_editor_write" ON flag_variants
  FOR ALL USING (
    flag_id IN (
      SELECT ff.id FROM feature_flags ff
      JOIN projects p ON p.id = ff.project_id
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin', 'editor')
    )
  );

-- audit_logs: 読み取りのみ、書き込みはサービスロールで行う
CREATE POLICY "audit_logs_org_member_read" ON audit_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- api_keys: admin以上のみ
CREATE POLICY "api_keys_admin" ON api_keys
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- flag_staleness_reports: 組織メンバー読み取り
CREATE POLICY "staleness_reports_member_read" ON flag_staleness_reports
  FOR SELECT USING (
    flag_id IN (
      SELECT ff.id FROM feature_flags ff
      JOIN projects p ON p.id = ff.project_id
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE om.user_id = auth.uid()
    )
  );
