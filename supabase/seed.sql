-- Seed data for feature-flags
-- Note: This seed assumes auth.users are created manually or via Supabase Auth
-- User IDs are placeholders - replace with actual user IDs from auth.users

-- Demo organization
INSERT INTO organizations (id, name, slug) VALUES
  ('a1b2c3d4-0000-4000-8000-000000000001', 'Acme Software', 'acme-software'),
  ('a1b2c3d4-0000-4000-8000-000000000002', 'FinTech Labs', 'fintech-labs');

-- Demo projects for Acme Software
INSERT INTO projects (id, organization_id, name, slug, description) VALUES
  ('b1b2c3d4-0000-4000-8000-000000000001', 'a1b2c3d4-0000-4000-8000-000000000001', 'Main API', 'main-api', 'Core backend API for Acme platform'),
  ('b1b2c3d4-0000-4000-8000-000000000002', 'a1b2c3d4-0000-4000-8000-000000000001', 'Web Frontend', 'web-frontend', 'React web application'),
  ('b1b2c3d4-0000-4000-8000-000000000003', 'a1b2c3d4-0000-4000-8000-000000000002', 'Trading Engine', 'trading-engine', 'High-frequency trading system');

-- Environments for Main API
INSERT INTO environments (id, project_id, name, slug, color, sdk_key) VALUES
  ('c1b2c3d4-0000-4000-8000-000000000001', 'b1b2c3d4-0000-4000-8000-000000000001', 'Development', 'development', '#22c55e', 'ff_dev_7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d'),
  ('c1b2c3d4-0000-4000-8000-000000000002', 'b1b2c3d4-0000-4000-8000-000000000001', 'Staging', 'staging', '#f59e0b', 'ff_stg_3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b'),
  ('c1b2c3d4-0000-4000-8000-000000000003', 'b1b2c3d4-0000-4000-8000-000000000001', 'Production', 'production', '#ef4444', 'ff_live_9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c'),
  ('c1b2c3d4-0000-4000-8000-000000000004', 'b1b2c3d4-0000-4000-8000-000000000002', 'Development', 'development', '#22c55e', 'ff_dev_4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f'),
  ('c1b2c3d4-0000-4000-8000-000000000005', 'b1b2c3d4-0000-4000-8000-000000000002', 'Production', 'production', '#ef4444', 'ff_live_0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a');

-- Feature flags for Main API (using placeholder user ID - will need auth user)
-- These will be replaced when actual users register
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Use a placeholder UUID that won't conflict
  v_user_id := '00000000-0000-0000-0000-000000000001';

  -- Attempt to get a real user from auth.users
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Feature flags for Main API
  INSERT INTO feature_flags (id, project_id, key, name, description, flag_type, tags, created_by) VALUES
    ('d1b2c3d4-0000-4000-8000-000000000001', 'b1b2c3d4-0000-4000-8000-000000000001', 'new-payment-flow', 'New Payment Flow', 'Redesigned checkout experience with Stripe Elements', 'boolean', ARRAY['payments', 'checkout', 'ux'], v_user_id),
    ('d1b2c3d4-0000-4000-8000-000000000002', 'b1b2c3d4-0000-4000-8000-000000000001', 'ai-recommendations', 'AI Product Recommendations', 'ML-powered product recommendation engine', 'boolean', ARRAY['ai', 'recommendations', 'ml'], v_user_id),
    ('d1b2c3d4-0000-4000-8000-000000000003', 'b1b2c3d4-0000-4000-8000-000000000001', 'max-items-per-cart', 'Max Items Per Cart', 'Maximum number of items allowed in shopping cart', 'number', ARRAY['cart', 'limits'], v_user_id),
    ('d1b2c3d4-0000-4000-8000-000000000004', 'b1b2c3d4-0000-4000-8000-000000000001', 'checkout-button-copy', 'Checkout Button Copy', 'CTA text for checkout button A/B test', 'string', ARRAY['copy', 'ab-test', 'checkout'], v_user_id),
    ('d1b2c3d4-0000-4000-8000-000000000005', 'b1b2c3d4-0000-4000-8000-000000000001', 'feature-pricing-v2', 'Pricing Page V2', 'New pricing page with usage-based tiers', 'boolean', ARRAY['pricing', 'marketing'], v_user_id),
    ('d1b2c3d4-0000-4000-8000-000000000006', 'b1b2c3d4-0000-4000-8000-000000000001', 'dark-mode', 'Dark Mode', 'Dark mode UI toggle', 'boolean', ARRAY['ui', 'accessibility'], v_user_id),
    ('d1b2c3d4-0000-4000-8000-000000000007', 'b1b2c3d4-0000-4000-8000-000000000001', 'stripe-payment-config', 'Stripe Payment Config', 'Dynamic Stripe configuration object', 'json', ARRAY['payments', 'config'], v_user_id);

  -- Flag configurations
  INSERT INTO flag_configurations (flag_id, environment_id, enabled, default_value, rollout_percent, updated_by) VALUES
    -- new-payment-flow: dev=ON, staging=ON 50%, prod=OFF
    ('d1b2c3d4-0000-4000-8000-000000000001', 'c1b2c3d4-0000-4000-8000-000000000001', true, 'true', 100, v_user_id),
    ('d1b2c3d4-0000-4000-8000-000000000001', 'c1b2c3d4-0000-4000-8000-000000000002', true, 'true', 50, v_user_id),
    ('d1b2c3d4-0000-4000-8000-000000000001', 'c1b2c3d4-0000-4000-8000-000000000003', false, 'false', NULL, v_user_id),
    -- ai-recommendations: dev=ON, staging=ON, prod=ON
    ('d1b2c3d4-0000-4000-8000-000000000002', 'c1b2c3d4-0000-4000-8000-000000000001', true, 'true', 100, v_user_id),
    ('d1b2c3d4-0000-4000-8000-000000000002', 'c1b2c3d4-0000-4000-8000-000000000002', true, 'true', 100, v_user_id),
    ('d1b2c3d4-0000-4000-8000-000000000002', 'c1b2c3d4-0000-4000-8000-000000000003', true, 'true', 25, v_user_id),
    -- max-items-per-cart: 50 in dev, 100 in prod
    ('d1b2c3d4-0000-4000-8000-000000000003', 'c1b2c3d4-0000-4000-8000-000000000001', true, '50', NULL, v_user_id),
    ('d1b2c3d4-0000-4000-8000-000000000003', 'c1b2c3d4-0000-4000-8000-000000000002', true, '75', NULL, v_user_id),
    ('d1b2c3d4-0000-4000-8000-000000000003', 'c1b2c3d4-0000-4000-8000-000000000003', true, '100', NULL, v_user_id),
    -- checkout-button-copy: A/B test
    ('d1b2c3d4-0000-4000-8000-000000000004', 'c1b2c3d4-0000-4000-8000-000000000001', true, '"Complete Purchase"', NULL, v_user_id),
    ('d1b2c3d4-0000-4000-8000-000000000004', 'c1b2c3d4-0000-4000-8000-000000000002', true, '"Buy Now"', NULL, v_user_id),
    ('d1b2c3d4-0000-4000-8000-000000000004', 'c1b2c3d4-0000-4000-8000-000000000003', true, '"Complete Purchase"', NULL, v_user_id),
    -- feature-pricing-v2: off everywhere
    ('d1b2c3d4-0000-4000-8000-000000000005', 'c1b2c3d4-0000-4000-8000-000000000001', true, 'true', 100, v_user_id),
    ('d1b2c3d4-0000-4000-8000-000000000005', 'c1b2c3d4-0000-4000-8000-000000000002', false, 'false', NULL, v_user_id),
    ('d1b2c3d4-0000-4000-8000-000000000005', 'c1b2c3d4-0000-4000-8000-000000000003', false, 'false', NULL, v_user_id),
    -- dark-mode
    ('d1b2c3d4-0000-4000-8000-000000000006', 'c1b2c3d4-0000-4000-8000-000000000001', true, 'true', 100, v_user_id),
    ('d1b2c3d4-0000-4000-8000-000000000006', 'c1b2c3d4-0000-4000-8000-000000000002', true, 'true', 100, v_user_id),
    ('d1b2c3d4-0000-4000-8000-000000000006', 'c1b2c3d4-0000-4000-8000-000000000003', true, 'true', 100, v_user_id),
    -- stripe-payment-config
    ('d1b2c3d4-0000-4000-8000-000000000007', 'c1b2c3d4-0000-4000-8000-000000000001', true, '{"capture_method": "manual", "allow_redirects": "never"}', NULL, v_user_id),
    ('d1b2c3d4-0000-4000-8000-000000000007', 'c1b2c3d4-0000-4000-8000-000000000003', true, '{"capture_method": "automatic", "allow_redirects": "always"}', NULL, v_user_id);

END $$;
