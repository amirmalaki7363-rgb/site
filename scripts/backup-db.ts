// Usage:  bun run db:backup
// Creates a consistent SQLite snapshot in ./backups/ (VACUUM INTO) and keeps the newest 14.
// Schedule it daily (Windows Task Scheduler / cron) and copy ./backups off the server.
import { PrismaClient } from "@prisma/client";
import { mkdirSync, readdirSync, rmSync } from "fs";
import { resolve } from "path";

const dir = resolve("backups");
mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const file = resolve(dir, `custom-${stamp}.db`).replace(/\\/g, "/");

const db = new PrismaClient();
await db.$executeRawUnsafe(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
await db.$disconnect();

const all = readdirSync(dir).filter((f) => f.startsWith("custom-") && f.endsWith(".db")).sort();
for (const old of all.slice(0, Math.max(0, all.length - 14))) rmSync(resolve(dir, old));
console.log(`Backup written: ${file}  (kept ${Math.min(all.length, 14)} newest)`);
