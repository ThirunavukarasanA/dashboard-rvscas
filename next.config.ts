import type { NextConfig } from "next";

function normalizeDevOrigin(entry: string) {
  const value = entry.trim();

  if (!value) {
    return null;
  }

  try {
    const url = value.includes("://") ? new URL(value) : new URL(`http://${value}`);
    return url.hostname.toLowerCase();
  } catch {
    return value.toLowerCase();
  }
}

const allowedDevOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS ?? "localhost,192.168.67.6")
  .split(",")
  .map((entry) => normalizeDevOrigin(entry))
  .filter((origin): origin is string => Boolean(origin));

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  allowedDevOrigins,
};

export default nextConfig;
