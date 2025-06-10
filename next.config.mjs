/** @type {import('next').NextConfig} */

const isGithubPages = process.env.NODE_ENV === "production";

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: "export", // enables static export
  assetPrefix: isGithubPages ? "/capturecast/" : "",
  basePath: isGithubPages ? "/capturecast" : "",
  trailingSlash: true, // important for GitHub Pages routing
};

export default nextConfig;
