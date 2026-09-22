// Keep browser requests same-origin while the existing API stays on Render.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (
      url.pathname === '/api' ||
      url.pathname.startsWith('/api/') ||
      url.pathname === '/docs' ||
      url.pathname === '/openapi.json'
    ) {
      url.hostname = 'gulf-invoice-backend.onrender.com';
      url.protocol = 'https:';
      url.port = '';
      return fetch(new Request(url, request), { redirect: 'manual' });
    }
    return env.ASSETS.fetch(request);
  },
};
