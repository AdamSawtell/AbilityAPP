import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // Keep Chromium out of the server bundle — required for Lambda/Amplify compute size limits.
  serverExternalPackages: ["@sparticuz/chromium-min", "puppeteer-core"],
  outputFileTracingIncludes: {
    "/api/documents/render-pdf": ["./node_modules/@sparticuz/chromium-min/**"],
  },
};

export default nextConfig;
