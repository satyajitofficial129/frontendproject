module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://edutunedqm.com/api/:path*',
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'export', 
};
