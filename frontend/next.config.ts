import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 배포 시 API URL 환경변수로 주입
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  },
};

export default nextConfig;
