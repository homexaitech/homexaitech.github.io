import type { NextConfig } from "next";

// Static-export-ready: the app talks directly to Supabase from the browser, so
// there is no server to host. `output: "export"` lets `next build` emit a fully
// static `out/` that drops onto Cloudflare Pages with zero code change. During
// local `next dev` this config is inert — dev still runs a normal dev server.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
