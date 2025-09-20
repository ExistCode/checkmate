import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Do not fail the production build on ESLint errors
    ignoreDuringBuilds: true,
  },
  // Expose only non-sensitive/public config at build time
  env: {
    APP_REGION: process.env.APP_REGION as string,
    COGNITO_REGION: process.env.COGNITO_REGION as string,
    NEXT_PUBLIC_COGNITO_CLIENT_ID: process.env
      .NEXT_PUBLIC_COGNITO_CLIENT_ID as string,
    NEXT_PUBLIC_COGNITO_DOMAIN: process.env
      .NEXT_PUBLIC_COGNITO_DOMAIN as string,
    BEDROCK_MODEL_ID: process.env.BEDROCK_MODEL_ID as string,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
