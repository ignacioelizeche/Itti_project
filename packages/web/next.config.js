/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
        has: [
          {
            type: "header",
            key: "accept",
            value: ".*(text/event-stream).*",
          },
        ],
      },
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
    ];
  },
  headers: async () => [
    {
      source: "/api/:path*",
      headers: [
        { key: "X-Accel-Buffering", value: "no" },
      ],
    },
  ],
};

module.exports = nextConfig;
