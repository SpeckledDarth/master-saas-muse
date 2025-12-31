import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

// Extend Request type to include userId and isAdmin
interface AuthenticatedRequest extends Request {
  userId?: string;
  isAdmin?: boolean;
  appId?: string;
}

// Middleware to extract user ID from request header
const extractUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  if (userId) {
    req.userId = userId;
    const userRole = await storage.getUserRole(userId);
    req.isAdmin = userRole?.role === 'admin';
  }
  next();
};

// Middleware to require admin role
const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Enhanced middleware: logs hostname and extracts potential app_id from subdomain
  app.use((req: AuthenticatedRequest, res, next) => {
    const hostname = req.hostname;
    const url = req.url;
    
    // Multi-tenancy stub: Extract potential app_id from hostname
    const hostParts = hostname.split('.');
    const potentialAppId = hostParts.length > 2 ? hostParts[0] : null;
    
    console.log(`[Middleware] Hostname: ${hostname} | URL: ${url}${potentialAppId ? ` | Potential app_id: ${potentialAppId}` : ''}`);
    
    req.appId = potentialAppId || undefined;
    next();
  });

  // Apply user extraction middleware to all routes
  app.use(extractUser);

  // API Routes
  app.get(api.status.get.path, async (req, res) => {
    const status = await storage.getStatus();
    res.json({ status });
  });

  // Webhook: user.created stub
  app.post("/api/webhooks/user.created", async (req, res) => {
    console.log("[Webhook] user.created payload:", JSON.stringify(req.body, null, 2));
    res.status(200).json({ received: true });
  });

  // ==================== USER ROLE ENDPOINTS ====================
  
  // Get current user's role (auto-creates member role if not exists)
  app.get("/api/user/role", async (req: AuthenticatedRequest, res) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    let role = await storage.getUserRole(req.userId);
    
    // Auto-create member role for new users if they don't have one
    if (!role) {
      try {
        role = await storage.setUserRole(req.userId, 'member');
        console.log(`[Auto-role] Created member role for user: ${req.userId}`);
      } catch (error) {
        console.error('[Auto-role] Error creating role:', error);
        // Still return member role even if DB insert fails
        return res.json({ role: 'member', isAdmin: false });
      }
    }
    
    res.json({ role: role?.role || 'member', isAdmin: role?.role === 'admin' });
  });

  // ==================== ADMIN ENDPOINTS ====================
  
  // Admin: Get dashboard metrics
  app.get("/api/admin/metrics", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const metrics = await storage.getAdminMetrics();
      // Map to frontend-expected field names
      res.json({
        totalUsers: metrics.totalUsers,
        adminUsers: metrics.adminCount,
        memberUsers: metrics.memberCount,
        recentSignups: 0 // TODO: implement recent signups tracking
      });
    } catch (error) {
      console.error('[Admin] Error fetching metrics:', error);
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  });

  // Admin: List all users with roles
  app.get("/api/admin/users", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const users = await storage.listUserRoles();
      res.json(users);
    } catch (error) {
      console.error('[Admin] Error listing users:', error);
      res.status(500).json({ error: 'Failed to list users' });
    }
  });

  // Admin: Update user role
  app.patch("/api/admin/users/:userId/role", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!role || !['admin', 'member'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be "admin" or "member"' });
      }
      
      // Prevent demoting the last admin
      if (role === 'member') {
        const currentRole = await storage.getUserRole(userId);
        if (currentRole?.role === 'admin') {
          const metrics = await storage.getAdminMetrics();
          if (metrics.adminCount <= 1) {
            return res.status(400).json({ error: 'Cannot demote the last admin. Promote another user first.' });
          }
        }
      }
      
      const updated = await storage.setUserRole(userId, role);
      
      // Log this admin action
      await storage.createAuditLog({
        userId: req.userId!,
        action: 'update_user_role',
        targetType: 'user',
        targetId: userId,
        metadata: { newRole: role }
      });
      
      res.json(updated);
    } catch (error) {
      console.error('[Admin] Error updating user role:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  });

  // Admin: List organization settings
  app.get("/api/admin/settings", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const settingsList = await storage.listOrgSettings();
      // Convert key-value list to structured object for frontend
      const settingsMap: Record<string, string> = {};
      settingsList.forEach(s => { settingsMap[s.key] = s.value; });
      
      res.json({
        id: 1,
        name: settingsMap['org_name'] || 'My SaaS App',
        settings: {
          allowSignups: settingsMap['allow_signups'] !== 'false',
          maintenanceMode: settingsMap['maintenance_mode'] === 'true',
          supportEmail: settingsMap['support_email'] || '',
          requireEmailVerification: settingsMap['require_email_verification'] !== 'false',
          enableGoogleAuth: settingsMap['enable_google_auth'] !== 'false',
        }
      });
    } catch (error) {
      console.error('[Admin] Error listing settings:', error);
      res.status(500).json({ error: 'Failed to list settings' });
    }
  });

  // Admin: Update organization settings
  app.put("/api/admin/settings", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { name, settings } = req.body;
      
      // Save individual settings as key-value pairs
      if (name) {
        await storage.setOrgSetting('org_name', name, 'Organization name');
      }
      if (settings) {
        if (typeof settings.allowSignups === 'boolean') {
          await storage.setOrgSetting('allow_signups', String(settings.allowSignups), 'Allow new user registrations');
        }
        if (typeof settings.maintenanceMode === 'boolean') {
          await storage.setOrgSetting('maintenance_mode', String(settings.maintenanceMode), 'Show maintenance page to users');
        }
        if (typeof settings.supportEmail === 'string') {
          await storage.setOrgSetting('support_email', settings.supportEmail, 'Support contact email');
        }
        if (typeof settings.requireEmailVerification === 'boolean') {
          await storage.setOrgSetting('require_email_verification', String(settings.requireEmailVerification), 'Require email verification for new accounts');
        }
        if (typeof settings.enableGoogleAuth === 'boolean') {
          await storage.setOrgSetting('enable_google_auth', String(settings.enableGoogleAuth), 'Enable Google OAuth login');
        }
      }
      
      // Log this admin action
      await storage.createAuditLog({
        userId: req.userId!,
        action: 'update_settings',
        targetType: 'setting',
        targetId: 'organization',
        metadata: { name, settings }
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('[Admin] Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Admin: List audit logs
  app.get("/api/admin/audit-logs", requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.listAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error('[Admin] Error listing audit logs:', error);
      res.status(500).json({ error: 'Failed to list audit logs' });
    }
  });

  // ==================== SUBSCRIPTION ENDPOINTS ====================
  
  // Get current user's subscription status
  app.get("/api/subscription", async (req: AuthenticatedRequest, res) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
      const subscription = await storage.getSubscription(req.userId);
      res.json(subscription);
    } catch (error) {
      console.error('[Subscription] Error fetching subscription:', error);
      res.status(500).json({ error: 'Failed to fetch subscription' });
    }
  });

  // Bootstrap: Make first user admin (one-time setup endpoint)
  app.post("/api/admin/bootstrap", async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Check if any admin exists
      const metrics = await storage.getAdminMetrics();
      if (metrics.adminCount > 0) {
        return res.status(400).json({ error: 'Admin already exists. Use admin panel to manage roles.' });
      }
      
      // Make the requesting user an admin
      const role = await storage.setUserRole(req.userId, 'admin');
      
      await storage.createAuditLog({
        userId: req.userId,
        action: 'bootstrap_admin',
        targetType: 'user',
        targetId: req.userId,
        metadata: { note: 'First admin created via bootstrap' }
      });
      
      res.json({ success: true, role });
    } catch (error) {
      console.error('[Admin] Error bootstrapping admin:', error);
      res.status(500).json({ error: 'Failed to bootstrap admin' });
    }
  });

  return httpServer;
}
