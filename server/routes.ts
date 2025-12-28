import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Enhanced middleware: logs hostname and extracts potential app_id from subdomain
  app.use((req, res, next) => {
    const hostname = req.hostname;
    const url = req.url;
    
    // Multi-tenancy stub: Extract potential app_id from hostname
    // Format: {app_id}.yourdomain.com or {app_id}.replit.app
    const hostParts = hostname.split('.');
    const potentialAppId = hostParts.length > 2 ? hostParts[0] : null;
    
    console.log(`[Middleware] Hostname: ${hostname} | URL: ${url}${potentialAppId ? ` | Potential app_id: ${potentialAppId}` : ''}`);
    
    // Attach app_id to request for downstream use (stub for future resolution)
    (req as any).appId = potentialAppId;
    
    next();
  });

  // API Routes
  app.get(api.status.get.path, async (req, res) => {
    const status = await storage.getStatus();
    res.json({ status });
  });

  // Webhook: user.created stub
  // This will be called by Supabase when a new user signs up
  app.post("/api/webhooks/user.created", async (req, res) => {
    console.log("[Webhook] user.created payload:", JSON.stringify(req.body, null, 2));
    
    // Stub: In a real implementation, you would:
    // 1. Validate the webhook signature
    // 2. Extract user data from the payload
    // 3. Create corresponding records in your database
    // 4. Trigger any onboarding workflows
    
    res.status(200).json({ received: true });
  });

  return httpServer;
}
