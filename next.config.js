module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://test.api.prantosaha.com/public/api/:path*',
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'export', 
};
