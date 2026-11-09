// Usage (inside the site folder):
//   bun scripts/reset-admin-password.ts "YourNewStrongPassword"
// Sets the password of the admin account (phone 09121111111) in the database from DATABASE_URL.
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const pw = process.argv[2];
if (!pw || pw.length < 8) {
  console.error('Password must be at least 8 characters.\nExample: bun scripts/reset-admin-password.ts "MyStrongPass123"');
  process.exit(1);
}
const db = new PrismaClient();
const admin = await db.user.findFirst({ where: { role: "admin" } });
if (!admin) {
  console.error("No admin user found in this database. Did you point DATABASE_URL at the right file?");
  process.exit(1);
}
const salt = randomBytes(16).toString("hex");
const hash = `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
await db.user.update({ where: { id: admin.id }, data: { password: hash, isBanned: false } });
console.log(`OK. Admin login -> phone: ${admin.phone}  | new password set.`);
await db.$disconnect();
