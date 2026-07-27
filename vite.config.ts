import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    // StackBlitz proxies the WebContainer through a generated *.stackblitz.io host.
    allowedHosts: ['.stackblitz.io'],
  },
});
