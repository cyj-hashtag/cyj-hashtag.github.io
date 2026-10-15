const BACKEND = 'https://cyj-hashtag-github-io.onrender.com';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/partition-quiz/server-config.json') {
      return Response.json({serverUrl:url.origin}, {headers:{'Cache-Control':'no-store'}});
    }
    if (url.pathname !== '/api/session' && url.pathname !== '/socket') {
      return env.ASSETS.fetch(request);
    }
    const origin = request.headers.get('Origin');
    if (origin && origin !== url.origin) {
      return Response.json({error:'网站来源未获允许。'}, {status:403});
    }
    if (url.pathname === '/api/session' && request.method !== 'POST') {
      return new Response('Method not allowed', {status:405, headers:{Allow:'POST'}});
    }
    if (url.pathname === '/socket' && (request.method !== 'GET' || request.headers.get('Upgrade')?.toLowerCase() !== 'websocket')) {
      return new Response('WebSocket upgrade required', {status:426});
    }
    const upstream = new URL(url.pathname + url.search, BACKEND);
    const proxied = new Request(upstream, request);
    // This is a server-to-server request; browser cookies and page origins stay on this site.
    proxied.headers.delete('Origin');
    proxied.headers.delete('Cookie');
    proxied.headers.delete('Referer');
    return fetch(proxied, {redirect:'manual'});
  }
};
