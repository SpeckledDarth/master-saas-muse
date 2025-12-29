import { 
  settings, 
  userRoles, 
  organizationSettings, 
  auditLogs,
  type Setting, 
  type InsertSetting,
  type UserRole,
  type InsertUserRole,
  type OrgSettings,
  type InsertOrgSettings,
  type AuditLog,
  type InsertAuditLog
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count } from "drizzle-orm";

export interface IStorage {
  getStatus(): Promise<string>;
  
  // User roles
  getUserRole(userId: string): Promise<UserRole | undefined>;
  setUserRole(userId: string, role: string): Promise<UserRole>;
  listUserRoles(): Promise<UserRole[]>;
  
  // Organization settings
  getOrgSetting(key: string): Promise<OrgSettings | undefined>;
  setOrgSetting(key: string, value: string, description?: string): Promise<OrgSettings>;
  listOrgSettings(): Promise<OrgSettings[]>;
  
  // Audit logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  listAuditLogs(limit?: number): Promise<AuditLog[]>;
  
  // Admin metrics
  getAdminMetrics(): Promise<{ totalUsers: number; adminCount: number; memberCount: number }>;
}

export class DatabaseStorage implements IStorage {
  async getStatus(): Promise<string> {
    try {
      await db.select().from(settings).limit(1);
      return "connected";
    } catch (e) {
      return "error";
    }
  }

  // User roles
  async getUserRole(userId: string): Promise<UserRole | undefined> {
    const [role] = await db.select().from(userRoles).where(eq(userRoles.userId, userId));
    return role;
  }

  async setUserRole(userId: string, role: string): Promise<UserRole> {
    const existing = await this.getUserRole(userId);
    if (existing) {
      const [updated] = await db
        .update(userRoles)
        .set({ role, assignedAt: new Date() })
        .where(eq(userRoles.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userRoles)
        .values({ userId, role })
        .returning();
      return created;
    }
  }

  async listUserRoles(): Promise<UserRole[]> {
    return db.select().from(userRoles).orderBy(desc(userRoles.assignedAt));
  }

  // Organization settings
  async getOrgSetting(key: string): Promise<OrgSettings | undefined> {
    const [setting] = await db.select().from(organizationSettings).where(eq(organizationSettings.key, key));
    return setting;
  }

  async setOrgSetting(key: string, value: string, description?: string): Promise<OrgSettings> {
    const existing = await this.getOrgSetting(key);
    if (existing) {
      const [updated] = await db
        .update(organizationSettings)
        .set({ value, description, updatedAt: new Date() })
        .where(eq(organizationSettings.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(organizationSettings)
        .values({ key, value, description })
        .returning();
      return created;
    }
  }

  async listOrgSettings(): Promise<OrgSettings[]> {
    return db.select().from(organizationSettings);
  }

  // Audit logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  async listAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  }

  // Admin metrics
  async getAdminMetrics(): Promise<{ totalUsers: number; adminCount: number; memberCount: number }> {
    const roles = await this.listUserRoles();
    const adminCount = roles.filter(r => r.role === 'admin').length;
    const memberCount = roles.filter(r => r.role === 'member').length;
    return {
      totalUsers: roles.length,
      adminCount,
      memberCount
    };
  }
}

export const storage = new DatabaseStorage();
