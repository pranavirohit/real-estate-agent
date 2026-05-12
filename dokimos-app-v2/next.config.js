/** @type {import('next').NextConfig} */
const nextConfig = {
  // getUserMedia + Strict Mode double-mount can leave a stale rejection that sets "Camera access denied"
  // while the active stream is fine; camera code uses session guards + deferred setError to mitigate.
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      encoding: false,
    };
    return config;
  },
  async redirects() {
    /** When set on Vercel (e.g. NOSTOS_PRIMARY_SITE=1), `/` redirects to `/nostos` so the root matches Nostos branding. Local Dokimos marketing stays at `/` unless this env is set at build time. */
    const list = [
      { source: "/notos", destination: "/nostos", permanent: false },
      { source: "/notos/:path*", destination: "/nostos/:path*", permanent: false },
    ];
    const nostosPrimary =
      process.env.NOSTOS_PRIMARY_SITE === "1" ||
      process.env.NOSTOS_PRIMARY_SITE === "true";
    if (nostosPrimary) {
      list.unshift({ source: "/", destination: "/nostos", permanent: false });
    }
    return list;
  },
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    // style-src includes blob: so dev/HMR and some tooling can attach stylesheets without breaking the page.
    const csp = isDev
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' blob:; img-src 'self' data: blob: https://images.unsplash.com; font-src 'self'; connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*; frame-src https://www.openstreetmap.org"
      : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' blob:; img-src 'self' data: blob: https://images.unsplash.com; font-src 'self'; connect-src 'self'; frame-src https://www.openstreetmap.org";

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
