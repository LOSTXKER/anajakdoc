import { PrismaClient } from ".prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  try {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error("[Prisma] DATABASE_URL is not set!");
      throw new Error("DATABASE_URL environment variable is not set");
    }

    console.log("[Prisma] Creating client with connection string:", connectionString.substring(0, 30) + "...");
    
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    
    const client = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

    console.log("[Prisma] Client created successfully");
    return client;
  } catch (error) {
    console.error("[Prisma] Failed to create client:", error);
    throw error;
  }
}

let prismaInstance: PrismaClient;

try {
  prismaInstance = globalForPrisma.prisma ?? createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaInstance;
  }
} catch (error) {
  console.error("[Prisma] Initialization failed:", error);
  // Create a dummy client that throws on access (better error messages)
  prismaInstance = new Proxy({} as PrismaClient, {
    get(_, prop) {
      throw new Error(`Prisma client not initialized. DATABASE_URL may be missing. Attempted to access: ${String(prop)}`);
    },
  });
}

export const prisma = prismaInstance;
export default prisma;
