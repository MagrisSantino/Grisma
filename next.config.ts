import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "cdn.worldvectorlogo.com", pathname: "/**" },
    ],
    /** Permite `/fondos/*.jpg?v=…` para invalidar caché al reemplazar fotos con el mismo nombre. */
    localPatterns: [{ pathname: "/fondos/**" }],
    ...(process.env.NODE_ENV === "development"
      ? { minimumCacheTTL: 0 }
      : {}),
  },
};

export default nextConfig;
