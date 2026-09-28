import { ProxyServer } from './proxy-server.js';

const PORT = Number(process.env.GATEWAY_PORT || 3105);
const TARGET_URL = process.env.PAPERCLIP_TARGET_URL || 'http://127.0.0.1:3100';

const proxy = new ProxyServer({
  port: PORT,
  targetBase: TARGET_URL
});

proxy.start().catch((err) => {
  console.error('[Jev Reverse Proxy] Failed to start server:', err);
  process.exit(1);
});

export { proxy };
