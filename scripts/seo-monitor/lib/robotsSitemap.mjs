export async function checkRobotsAndSitemap(config, siteUrl, { fetchImpl = fetch } = {}) {
  const findings = [];

  {
    const cfg = config.robotsTxt;
    const url = new URL(cfg.path, siteUrl).toString();
    const res = await fetchImpl(url);
    if (res.status !== cfg.expectedFinalStatus) {
      findings.push({ id: 'robots.txt', check: 'robots-txt', severity: 'fail', message: `robots.txt: status ${res.status}, esperado ${cfg.expectedFinalStatus}` });
    } else {
      const text = await res.text();
      const before = findings.length;
      for (const rule of cfg.mustDisallow ?? []) {
        if (!text.includes(`Disallow: ${rule}`)) {
          findings.push({ id: 'robots.txt', check: 'robots-txt', severity: 'fail', message: `robots.txt: falta "Disallow: ${rule}"` });
        }
      }
      for (const rule of cfg.mustNotDisallow ?? []) {
        if (text.includes(`Disallow: ${rule}`)) {
          findings.push({ id: 'robots.txt', check: 'robots-txt', severity: 'fail', message: `robots.txt: contiene "Disallow: ${rule}", que contradice el noindex declarado en el HTML de esa ruta` });
        }
      }
      if (cfg.mustContainSitemap && !text.includes(cfg.mustContainSitemap)) {
        findings.push({ id: 'robots.txt', check: 'robots-txt', severity: 'fail', message: 'robots.txt: no referencia el sitemap esperado' });
      }
      if (findings.length === before) {
        findings.push({ id: 'robots.txt', check: 'robots-txt', severity: 'ok', message: 'robots.txt correcto' });
      }
    }
  }

  if (config.sitemap) {
    const cfg = config.sitemap;
    const url = new URL(cfg.path, siteUrl).toString();
    const res = await fetchImpl(url);
    if (res.status !== cfg.expectedFinalStatus) {
      findings.push({ id: 'sitemap.xml', check: 'sitemap', severity: 'fail', message: `sitemap.xml: status ${res.status}, esperado ${cfg.expectedFinalStatus}` });
    } else {
      const text = await res.text();
      const before = findings.length;
      if (!text.trim().startsWith('<?xml')) {
        findings.push({ id: 'sitemap.xml', check: 'sitemap', severity: 'fail', message: 'sitemap.xml: no parece XML válido (no empieza con <?xml)' });
      }
      for (const u of cfg.mustContainUrls ?? []) {
        if (!text.includes(`<loc>${u}</loc>`)) {
          findings.push({ id: 'sitemap.xml', check: 'sitemap', severity: 'fail', message: `sitemap.xml: falta <loc>${u}</loc>` });
        }
      }
      if (findings.length === before) {
        findings.push({ id: 'sitemap.xml', check: 'sitemap', severity: 'ok', message: 'sitemap.xml correcto' });
      }
    }
  }

  return findings;
}
