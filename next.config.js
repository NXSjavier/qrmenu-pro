const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/menu.php',
        has: [{ type: 'query', key: 'r', value: '(?<slug>.*)' }, { type: 'query', key: 'm', value: '(?<codigo>.*)' }],
        destination: '/menu/:slug/:codigo',
      },
    ];
  },
};

module.exports = nextConfig;
