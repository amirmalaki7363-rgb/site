import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
// NOTE: next.config is evaluated at BUILD time, so set SITE_URL (https://...) in .env BEFORE `build`.
// HSTS is only sent when the public site is https; we deliberately do not use CSP `upgrade-insecure-requests`
// (enforce https with a redirect on the reverse proxy instead) so local production tests over http keep working.
const httpsSite = (process.env.SITE_URL ?? "").startsWith("https://");

// Next.js needs inline bootstrap scripts; 'unsafe-eval' only in dev (React refresh).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders: { key: string; value: string }[] = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];
if (!isDev && httpsSite) {
  // no "preload"/"includeSubDomains": both are hard to undo and affect other subdomains
  securityHeaders.push({ key: "Strict-Transport-Security", value: "max-age=31536000" });
}

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false, // do not advertise the framework
  compress: true,
  reactStrictMode: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // user-uploaded images: lock the response down completely (listed AFTER the global rule so it wins)
      { source: "/api/images/:path*", headers: [{ key: "Content-Security-Policy", value: "default-src 'none'; sandbox" }] },
      // API responses (sessions, orders, wallet) must never be cached by browsers/proxies
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      // long-lived caching for static media (SEO/perf: LCP + repeat visits)
      {
        source: "/(images|products|fonts)/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
