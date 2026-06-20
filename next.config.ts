import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 把你的局域网 IP 加入安全白名单
  allowedDevOrigins: ["192.168.100.34", "localhost"],
};

export default nextConfig;