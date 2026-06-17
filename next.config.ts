import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          has: [
            {
              type: "host",
              value: "admin.filego.in",
            },
          ],
          destination: "/admin",
        },
        {
          source: "/:path*",
          has: [
            {
              type: "host",
              value: "admin.filego.in",
            },
          ],
          destination: "/admin/:path*",
        },
      ],
    };
  },

  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: "https",
  //       hostname: "assets.example.com",
  //       port: "",
  //       pathname: "/**",
  //     },
  //   ],
  // },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve ??= {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
      };
    }

    return config;
  },
};

export default nextConfig;