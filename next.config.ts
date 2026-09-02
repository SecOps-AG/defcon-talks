import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The browser lives at "/" now. Keep the old address working — Next carries
  // the query string over, so shared /talks?q=… links still land filtered.
  async redirects() {
    return [{ source: "/talks", destination: "/", permanent: false }];
  },
};

export default nextConfig;
