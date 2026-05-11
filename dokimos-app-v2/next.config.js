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
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    // style-src includes blob: so dev/HMR and some tooling can attach stylesheets without breaking the page.
    const csp = isDev
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' blob:; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*"
      : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' blob:; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'";

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
