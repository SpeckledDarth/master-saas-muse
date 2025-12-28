import { settings, type Setting, type InsertSetting } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Minimal storage interface
  getStatus(): Promise<string>;
}

export class DatabaseStorage implements IStorage {
  async getStatus(): Promise<string> {
    // Just a dummy method to verify DB connection if needed
    try {
        await db.select().from(settings).limit(1);
        return "connected";
    } catch (e) {
        return "error";
    }
  }
}

export const storage = new DatabaseStorage();
