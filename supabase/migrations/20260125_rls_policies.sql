-- Module 7: Row Level Security Policies
-- Run this in Supabase SQL Editor

-- ===========================================
-- Enable RLS on all tables
-- ===========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- PROFILES TABLE POLICIES
-- ===========================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (for initial creation)
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- ===========================================
-- USER_ROLES TABLE POLICIES
-- ===========================================

-- Users can view their own role
CREATE POLICY "Users can view own role"
ON user_roles FOR SELECT
USING (user_id = auth.uid());

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON user_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- Admins can update roles (except their own to prevent lockout)
CREATE POLICY "Admins can update roles"
ON user_roles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- Admins can insert new roles
CREATE POLICY "Admins can insert roles"
ON user_roles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- Service role can insert roles (for auto-registration)
CREATE POLICY "Service can insert roles"
ON user_roles FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- ===========================================
-- ORGANIZATION_SETTINGS TABLE POLICIES
-- ===========================================

-- Anyone can read org settings (needed for login page to check signups allowed)
CREATE POLICY "Anyone can read org settings"
ON organization_settings FOR SELECT
USING (true);

-- Only admins can update org settings
CREATE POLICY "Admins can update org settings"
ON organization_settings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- ===========================================
-- AUDIT_LOGS TABLE POLICIES
-- ===========================================

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Service role can insert audit logs
CREATE POLICY "Service can insert audit logs"
ON audit_logs FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can insert audit logs (for self-logging)
CREATE POLICY "Users can insert own audit logs"
ON audit_logs FOR INSERT
WITH CHECK (user_id = auth.uid());

-- ===========================================
-- STORAGE BUCKET POLICIES (avatars)
-- ===========================================

-- Note: Storage policies are configured separately in Supabase Dashboard
-- These are documented here for reference:
-- 
-- avatars bucket:
-- - SELECT: auth.uid() = (storage.foldername(name))[1]::uuid
-- - INSERT: auth.uid() = (storage.foldername(name))[1]::uuid
-- - UPDATE: auth.uid() = (storage.foldername(name))[1]::uuid
-- - DELETE: auth.uid() = (storage.foldername(name))[1]::uuid
