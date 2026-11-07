import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------
// Shared security helpers (rate limiting, CSRF/origin check, escaping,
// image sniffing). Kept dependency-free so it works on any Node runtime.
// ---------------------------------------------------------------------

export const IS_PROD = process.env.NODE_ENV === "production";

/** Public origin of the site (used for callbacks/redirects; never trust the Host header for this). */
export function siteOrigin(req?: NextRequest): string {
  const env = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  if (env) return env;
  if (req) return req.nextUrl.origin;
  return "http://localhost:3000";
}

// ---------------- Rate limiting (in-memory, per process) ----------------
type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

/**
 * Returns true when the caller is OVER the limit.
 * Note: in-memory => per server instance. For multi-instance deployments use Redis.
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 20000) {
      for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
    }
    return false;
  }
  b.count += 1;
  return b.count > limit;
}

export function clientIp(req: NextRequest): string {
  // Caddy overwrites X-Forwarded-For with the real remote address.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim().slice(0, 64);
  return req.headers.get("x-real-ip")?.trim().slice(0, 64) || "unknown";
}

export function tooManyRequests(message = "تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.") {
  return NextResponse.json({ success: false, error: message }, { status: 429, headers: { "Retry-After": "60" } });
}

// ---------------- CSRF: same-origin check for state-changing requests ----------------
/**
 * Defense-in-depth on top of SameSite=Lax cookies.
 * Rejects browser requests whose Origin does not match this site.
 * Returns a 403 response when blocked, otherwise null.
 */
export function assertSameOrigin(req: NextRequest): NextResponse | null {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return null;

  const origin = req.headers.get("origin");
  const fetchSite = req.headers.get("sec-fetch-site");
  if (!origin) {
    // Non-browser clients (curl/server-to-server) send no Origin; browsers always do on POST.
    if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
      return NextResponse.json({ success: false, error: "درخواست نامعتبر است." }, { status: 403 });
    }
    return null;
  }
  try {
    const o = new URL(origin);
    const allowed = new Set<string>();
    allowed.add(req.nextUrl.host);
    const fwd = req.headers.get("x-forwarded-host");
    if (fwd) allowed.add(fwd.split(",")[0].trim());
    const env = process.env.SITE_URL;
    if (env) allowed.add(new URL(env).host);
    if (allowed.has(o.host)) return null;
  } catch {
    /* fallthrough */
  }
  return NextResponse.json({ success: false, error: "درخواست از مبدأ نامعتبر ارسال شده است." }, { status: 403 });
}

// ---------------- Escaping ----------------
export function escapeHtml(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------- Image sniffing (do not trust client-declared MIME) ----------------
export function sniffImageMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.slice(0, 4).toString("ascii") === "GIF8") return "image/gif";
  if (buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf.slice(4, 8).toString("ascii") === "ftyp") {
    const brand = buf.slice(8, 12).toString("ascii");
    if (brand === "avif" || brand === "avis") return "image/avif";
  }
  return null;
}

// ---------------- Small input helpers ----------------
export function str(v: unknown, max = 500): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export function pick<T extends Record<string, unknown>>(src: unknown, allowed: readonly string[]): Partial<T> {
  const out: Record<string, unknown> = {};
  if (!src || typeof src !== "object") return out as Partial<T>;
  for (const k of allowed) {
    if (k in (src as Record<string, unknown>)) out[k] = (src as Record<string, unknown>)[k];
  }
  return out as Partial<T>;
}
