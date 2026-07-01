import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // Pin the file-tracing root to the web app so it matches turbopack.root.
  // Without this Next infers the repo root (lockfile walk-up) and warns on every build.
  outputFileTracingRoot: path.join(__dirname),
  // Keep Chromium out of the server bundle — required for Lambda/Amplify compute size limits.
  serverExternalPackages: ["@sparticuz/chromium-min", "puppeteer-core"],
  outputFileTracingIncludes: {
    "/api/documents/render-pdf": ["./node_modules/@sparticuz/chromium-min/**"],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
