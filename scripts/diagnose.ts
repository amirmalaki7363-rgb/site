// Usage (inside the site folder):  bun scripts/diagnose.ts "رمزی که وارد می‌کنید"
// Prints everything needed to find why login / product pages fail. Does NOT change anything.
import { existsSync, statSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { scryptSync, timingSafeEqual } from "crypto";

const line = (k: string, v: unknown) => console.log(`${k.padEnd(34)} ${v}`);
const size = (p: string) => (existsSync(p) ? `${statSync(p).size} bytes` : "NOT FOUND");

console.log("===== DIAGNOSE =====");
line("working folder", process.cwd());
line("NODE_ENV", process.env.NODE_ENV ?? "(unset)");
line("DATABASE_URL", process.env.DATABASE_URL ?? "(unset!)");
const sec = process.env.AUTH_SECRET ?? "";
line("AUTH_SECRET length", `${sec.length} ${sec.length >= 32 ? "(ok)" : "(too short/missing — ok only in dev)"}`);
line("db/custom.db", size(resolve("db/custom.db")));
line("prisma/db/custom.db", size(resolve("prisma/db/custom.db")));
line("prisma/schema.prisma", size(resolve("prisma/schema.prisma")));

const db = new PrismaClient();
try {
  const tables = (await db.$queryRawUnsafe<{ name: string }[]>("SELECT name FROM sqlite_master WHERE type='table'")).map((t) => t.name);
  line("tables in the DB the app uses", tables.length ? tables.join(", ") : "NONE (empty database!)");
  const users = await db.user.findMany({ select: { phone: true, role: true, password: true, isBanned: true } });
  line("users", users.length);
  for (const u of users) console.log(`   - ${u.phone}  role=${u.role}  banned=${u.isBanned}`);
  line("products", await db.product.count());

  const pw = process.argv[2];
  const admin = users.find((u) => u.role === "admin");
  if (pw && admin) {
    const [salt, hash] = admin.password.split(":");
    const ok = timingSafeEqual(Buffer.from(hash, "hex"), scryptSync(pw, salt, 64));
    line("typed password matches admin?", ok ? "YES" : "NO (wrong password)");
  } else if (!pw) {
    console.log("(tip: add your password after the command to test it)");
  }
} catch (e) {
  console.log("\n!!! DATABASE ERROR — this is the real cause:\n");
  console.log(e instanceof Error ? e.message : e);
} finally {
  await db.$disconnect();
}
console.log("===== END =====");
