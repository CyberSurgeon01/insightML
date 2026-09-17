/** @type {import('next').NextConfig} */
const nextConfig = {
  // All API calls go to the FastAPI backend running on port 8000.
  // This rewrites /api/* → http://localhost:8000/api/* in development,
  // so the browser never sees a cross-origin request.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;

