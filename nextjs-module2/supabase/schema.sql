-- Module 3: Admin Features Database Schema
-- Run this in Supabase SQL Editor

-- User Roles Table
-- Stores role assignments for users (admin/member)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  app_id VARCHAR(100) DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, app_id)
);

-- Organization Settings Table
-- Stores app-wide settings and feature flags
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id VARCHAR(100) NOT NULL DEFAULT 'default' UNIQUE,
  organization_name VARCHAR(255) DEFAULT 'My SaaS',
  support_email VARCHAR(255) DEFAULT '',
  allow_signups BOOLEAN DEFAULT true,
  maintenance_mode BOOLEAN DEFAULT false,
  require_email_verification BOOLEAN DEFAULT true,
  enable_google_signin BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs Table
-- Records admin actions for compliance and debugging
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id VARCHAR(255),
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_app_id ON user_roles(app_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
-- Users can read their own role
CREATE POLICY "Users can read own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can read all roles
CREATE POLICY "Admins can read all roles" ON user_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert roles
CREATE POLICY "Admins can insert roles" ON user_roles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update roles
CREATE POLICY "Admins can update roles" ON user_roles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for organization_settings
-- Anyone authenticated can read settings
CREATE POLICY "Authenticated users can read settings" ON organization_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can update settings
CREATE POLICY "Admins can update settings" ON organization_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert settings
CREATE POLICY "Admins can insert settings" ON organization_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for audit_logs
-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Authenticated users can insert audit logs (for logging their own actions)
CREATE POLICY "Authenticated can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Insert default organization settings
INSERT INTO organization_settings (app_id, organization_name, support_email)
VALUES ('default', 'My SaaS', 'support@example.com')
ON CONFLICT (app_id) DO NOTHING;

-- Function to auto-register users with member role
CREATE OR REPLACE FUNCTION auto_register_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_roles (user_id, role, app_id)
  VALUES (NEW.id, 'member', 'default')
  ON CONFLICT (user_id, app_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-register new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION auto_register_user_role();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organization_settings_updated_at ON organization_settings;
CREATE TRIGGER update_organization_settings_updated_at
  BEFORE UPDATE ON organization_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
