// Sigue una cadena de redirects manualmente (redirect: 'manual') para poder
// inspeccionar el status code y el destino de cada salto, no solo el final.
export async function fetchChain(url, { fetchImpl = fetch, maxRedirects = 10 } = {}) {
  const chain = [];
  let current = url;

  for (let i = 0; i <= maxRedirects; i++) {
    const res = await fetchImpl(current, { redirect: 'manual' });
    const status = res.status;
    const location = res.headers.get('location');
    chain.push({ url: current, status, location });

    if (status >= 300 && status < 400 && location) {
      current = new URL(location, current).toString();
      continue;
    }

    const body = await res.text();
    return {
      chain,
      finalUrl: current,
      finalStatus: status,
      finalHeaders: res.headers,
      finalBody: body,
    };
  }

  throw new Error(`Demasiadas redirecciones para ${url}`);
}
