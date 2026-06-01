/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Socket.io is served from the same custom Node server (see server.ts),
  // so we keep the default Next config minimal.
};

module.exports = nextConfig;
