import type { NextConfig } from "next";

/* Vercel sets VERCEL=1 for every build it compiles itself. The headers
   and bundle rules below are therefore active only on the deployed
   experience; local development and the preview stay untouched. */
const onVercel = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  /* the preview stays pure cinema: no dev tools badge floating over
     the experience (production builds never show it anyway) */
  devIndicators: false,
  /* the craft ships closed: no browser source maps to read back and
     no framework banner to fingerprint */
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
};

if (onVercel) {
  /* Vercel compiles and serves the experience its own way, standalone
     output is a sandbox concern only */
  nextConfig.headers = async () => [
    {
      source: "/:path*",
      headers: [
        /* the experience is never embedded inside someone else's page */
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        /* search engines may index, but they may not keep cached copies */
        { key: "X-Robots-Tag", value: "noarchive" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
  ];
} else {
  /* the sandbox process manager expects the standalone server */
  nextConfig.output = "standalone";
}

export default nextConfig;
