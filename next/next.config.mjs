import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  outputFileTracingRoot: new URL(".", import.meta.url).pathname,
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
