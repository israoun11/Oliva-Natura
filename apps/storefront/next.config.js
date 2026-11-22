const API = process.env.API_URL || "http://localhost:4000";
// Same-origin proxy: the browser calls /api/* so httpOnly auth cookies work without CORS. NOTE: evaluated at build time —
// set API_URL before `next build` (Docker: build arg; Vercel: environment variable).
module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() { return [{ source: "/api/:path*", destination: `${API}/api/:path*` }]; },
  async headers() {
    return [
      { source: "/:path*", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }, { key: "X-Frame-Options", value: "SAMEORIGIN" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }] },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};
