import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Middleware requested by user: "minimal middleware.ts that just logs the request hostname"
  // In Express, we add it here.
  app.use((req, res, next) => {
    console.log(`[Middleware] Hostname: ${req.hostname} | URL: ${req.url}`);
    next();
  });

  // API Routes
  app.get(api.status.get.path, async (req, res) => {
    const status = await storage.getStatus();
    res.json({ status });
  });

  return httpServer;
}
