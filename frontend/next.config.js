/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" }
    ],
  },
  async rewrites() {
    // If NEXT_PUBLIC_API_URL is configured (e.g. on Railway/Render), proxy to it, else local
    const backendUrl = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, "")
      : "http://127.0.0.1:8000";

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
