import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@sgsst/core"],
  experimental: {
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default config;
