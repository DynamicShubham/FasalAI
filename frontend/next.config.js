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
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || "https://fasalai-backend-s9k8.onrender.com")
      .trim()
      .replace(/\/api\/v\d*$/, "")
      .replace(/\/api\/?$/, "")
      .replace(/\/+$/, "");

    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: "/decisions/:path*",
        destination: `${backendUrl}/api/v1/decisions/:path*`,
      },
      {
        source: "/weather/:path*",
        destination: `${backendUrl}/api/v1/weather/:path*`,
      },
      {
        source: "/market/:path*",
        destination: `${backendUrl}/api/v1/market/:path*`,
      },
      {
        source: "/schemes/:path*",
        destination: `${backendUrl}/api/v1/schemes/:path*`,
      },
      {
        source: "/crops/:path*",
        destination: `${backendUrl}/api/v1/crops/:path*`,
      },
      {
        source: "/assistant/:path*",
        destination: `${backendUrl}/api/v1/assistant/:path*`,
      },
      {
        source: "/vision/:path*",
        destination: `${backendUrl}/api/v1/vision/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
