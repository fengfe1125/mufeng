import { createProxyMiddleware } from 'http-proxy-middleware';

const upstreamUrl = process.env.MUFENG_UPSTREAM_URL || 'http://127.0.0.1:3001';

function buildProxy() {
  return createProxyMiddleware({
    target: upstreamUrl,
    changeOrigin: true,
    ws: true,
    pathRewrite: {
      '^/app': ''
    }
  });
}

export { upstreamUrl, buildProxy };
