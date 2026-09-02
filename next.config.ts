import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/neo062/image/upload/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/image-compress",
        destination: "/image-squoosh",
        permanent: true,
      },
      {
        source: "/bulk-image-compress",
        destination: "/bulk-image-compressor",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve ??= {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
        // Dead code behind Node-environment checks in 7z-wasm's emscripten glue.
        module: false,
        crypto: false,
        url: false,
      };
    }

    return config;
  },
};

export default nextConfig;