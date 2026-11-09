// Run:  bun run test      (plain assertions, no framework needed)
import assert from "node:assert/strict";
import { assertSameOrigin, escapeHtml, isRateLimited, pick, sniffImageMime } from "../src/lib/security";

let n = 0;
const t = (name: string, fn: () => void) => { fn(); n++; console.log("PASS", name); };
const req = (method: string, headers: Record<string, string>) =>
  ({ method, headers: { get: (k: string) => headers[k.toLowerCase()] ?? null }, nextUrl: { host: "shop.ir" } }) as never;

t("escapeHtml neutralises markup", () => {
  const out = escapeHtml('<img src=x onerror=alert(1)>"\'&');
  assert.ok(!out.includes("<") && !out.includes('"') && out.includes("&lt;img") && out.includes("&amp;"));
});

t("image sniffing accepts only raster images", () => {
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(16)]);
  const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(16)]);
  assert.equal(sniffImageMime(png), "image/png");
  assert.equal(sniffImageMime(jpg), "image/jpeg");
  assert.equal(sniffImageMime(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>')), null);
  assert.equal(sniffImageMime(Buffer.from("<html><script>alert(1)</script></html>")), null);
});

t("rate limiter blocks the 9th attempt", () => {
  let blockedAt = -1;
  for (let i = 1; i <= 12; i++) if (isRateLimited("test:login", 8, 60_000)) { blockedAt = i; break; }
  assert.equal(blockedAt, 9);
});

t("CSRF origin check", () => {
  assert.equal((assertSameOrigin(req("POST", { origin: "https://evil.com" })) as { status: number } | null)?.status, 403);
  assert.equal(assertSameOrigin(req("POST", { origin: "https://shop.ir" })), null);
  assert.equal((assertSameOrigin(req("POST", { "sec-fetch-site": "cross-site" })) as { status: number } | null)?.status, 403);
  assert.equal(assertSameOrigin(req("GET", { origin: "https://evil.com" })), null);
});

t("pick() blocks mass assignment (userId/role/id never pass)", () => {
  const out = pick({ title: "x", userId: "attacker", role: "admin", id: "1" }, ["title", "city"]);
  assert.deepEqual(out, { title: "x" });
});

console.log(`\n${n} test groups passed`);
