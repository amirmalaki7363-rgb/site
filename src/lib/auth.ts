import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

import { randomBytes as _rb } from "crypto";

let _devSecret: string | null = null;
/** Signing key. In production AUTH_SECRET is mandatory (>= 32 chars); no hard-coded fallback. */
function getSecret(): string {
  const env = process.env.AUTH_SECRET;
  if (env && env.length >= 32) return env;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set (>= 32 chars) in production.");
  }
  if (!_devSecret) {
    _devSecret = _rb(32).toString("hex");
    console.warn("[auth] AUTH_SECRET not set — using a random per-process dev secret (sessions reset on restart).");
  }
  return _devSecret;
}
export const SESSION_COOKIE = "gh_session";
const SESSION_DAYS = 30;

// ---------------- Password hashing (scrypt) ----------------
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export const MIN_PASSWORD_LENGTH = 8;
export function passwordPolicyError(pw: string): string | null {
  if (typeof pw !== "string" || pw.length < MIN_PASSWORD_LENGTH) return `رمز عبور باید حداقل ${MIN_PASSWORD_LENGTH} کاراکتر باشد.`;
  if (pw.length > 128) return "رمز عبور خیلی طولانی است.";
  return null;
}

/** Burn comparable CPU time when the account does not exist (prevents user-enumeration by timing). */
export function dummyVerify(password: string): void {
  try { scryptSync(password, "0000000000000000", 64); } catch { /* ignore */ }
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const test = scryptSync(password, salt, 64);
    const orig = Buffer.from(hash, "hex");
    return orig.length === test.length && timingSafeEqual(orig, test);
  } catch {
    return false;
  }
}

// ---------------- JWT (HMAC-SHA256) ----------------
interface TokenPayload {
  uid: string;
  role: string;
  pf: string; // password fingerprint — tokens die when the password changes
  iat: number;
  exp: number;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

/** Short keyed fingerprint of the stored password hash (changes on every password change). */
export function pwFingerprint(storedHash: string): string {
  return createHmac("sha256", getSecret()).update(`pf:${storedHash}`).digest("hex").slice(0, 16);
}

export function signToken(uid: string, role: string, pf: string): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    uid,
    role,
    pf,
    iat: now,
    exp: now + SESSION_DAYS * 24 * 60 * 60,
  };
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(createHmac("sha256", getSecret()).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expected = b64url(
      createHmac("sha256", getSecret()).update(`${header}.${body}`).digest()
    );
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(b64urlDecode(body).toString()) as TokenPayload;
    if (typeof payload.uid !== "string" || typeof payload.pf !== "string") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------------- Session user ----------------
export type SafeUser = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  city: string;
  birthday: string;
  gender: string;
  avatarHue: number;
  walletBalance: number;
  points: number;
  emailOffers: boolean;
  smsOffers: boolean;
  note: string;
  isBanned: boolean;
  memberSince: string;
};

export function toSafeUser(u: {
  id: string; name: string; phone: string; email: string; role: string;
  city: string; birthday: string; gender: string; avatarHue: number;
  walletBalance: number; points: number; emailOffers: boolean; smsOffers: boolean;
  note: string; isBanned: boolean; memberSince: Date;
}): SafeUser {
  const { password: _pw, createdAt: _c, ...rest } = u;
  return { ...rest, memberSince: u.memberSince.toISOString() };
}

/** Reads the session cookie from the request and loads the user. Returns null when guest / invalid / banned. */
export async function getSessionUser(
  req: NextRequest
): Promise<{ user: SafeUser } | { banned: true } | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await db.user.findUnique({ where: { id: payload.uid } });
  if (!user) return null;
  // revoke sessions issued before the last password change
  const fp = Buffer.from(pwFingerprint(user.password));
  const tp = Buffer.from(payload.pf);
  if (fp.length !== tp.length || !timingSafeEqual(fp, tp)) return null;
  if (user.isBanned) return { banned: true };
  return { user: toSafeUser(user) };
}

export async function requireUser(req: NextRequest): Promise<SafeUser | null> {
  const s = await getSessionUser(req);
  return s && "user" in s ? s.user : null;
}

export async function requireAdmin(req: NextRequest): Promise<SafeUser | null> {
  const u = await requireUser(req);
  return u && u.role === "admin" ? u : null;
}

function isHttps(req?: NextRequest): boolean {
  if (process.env.COOKIE_SECURE === "1") return true;
  if (process.env.COOKIE_SECURE === "0") return false;
  if (!req) return process.env.NODE_ENV === "production";
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  return proto === "https" || req.nextUrl.protocol === "https:";
}

/** Attach the session cookie to a response. `storedPasswordHash` binds the token to the current password. */
export function setSessionCookie(
  res: NextResponse, uid: string, role: string, storedPasswordHash: string, req?: NextRequest
) {
  res.cookies.set(SESSION_COOKIE, signToken(uid, role, pwFingerprint(storedPasswordHash)), {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps(req),
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export function clearSessionCookie(res: NextResponse, req?: NextRequest) {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps(req),
    path: "/",
    maxAge: 0,
  });
}

// ---------------- Helpers ----------------
export function isValidPhone(phone: string): boolean {
  return /^0\d{10}$/.test(phone.trim());
}

export function normalizePhone(phone: string): string {
  // convert persian/arabic digits to english
  return phone
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)))
    .trim();
}
