import { readdirSync as fsReaddirSync, readFileSync as fsReadFileSync } from 'node:fs';
import { join } from 'node:path';

export const PROFILES = ['public-seo', 'private-app'];

// Valida un sitio declarativo antes de correr nada sobre él. El caso que
// más importa evitar: una app privada (private-app) declarada por error
// con gscSiteUrl/sitemap, que la trataría como sitio SEO público — eso
// falla fuerte acá, no en silencio, porque es exactamente el riesgo que
// motivó separar los perfiles.
export function validateSite(site) {
  const errors = [];

  if (!site || typeof site !== 'object') {
    throw new Error('Configuración de sitio inválida: no es un objeto.');
  }
  if (!site.id) errors.push('falta "id"');
  if (!site.label) errors.push('falta "label"');
  if (!site.baseUrl) errors.push('falta "baseUrl"');
  if (!PROFILES.includes(site.profile)) {
    errors.push(`"profile" desconocido: ${JSON.stringify(site.profile)} (válidos: ${PROFILES.join(', ')})`);
  }
  if (!Array.isArray(site.urls) || site.urls.length === 0) errors.push('falta "urls" (array no vacío)');
  if (!site.robotsTxt) errors.push('falta "robotsTxt"');

  if (site.profile === 'public-seo' && !site.gscSiteUrl) {
    errors.push('perfil public-seo requiere "gscSiteUrl"');
  }
  if (site.profile === 'private-app') {
    if (site.gscSiteUrl) {
      errors.push('perfil private-app no debe declarar "gscSiteUrl" (evita tratar una app privada como sitio SEO público)');
    }
    if (site.sitemap) {
      errors.push('perfil private-app no debe declarar "sitemap"');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuración inválida para el sitio "${site?.id ?? '(sin id)'}": ${errors.join('; ')}`);
  }
}

// Lee todos los *.json de sitesDir (orden alfabético, determinista), los
// valida y devuelve la lista. fs es inyectable para tests sin disco real.
export function loadSites(sitesDir, { readdirSync = fsReaddirSync, readFileSync = fsReadFileSync } = {}) {
  const files = readdirSync(sitesDir).filter((f) => f.endsWith('.json')).sort();
  const sites = files.map((f) => JSON.parse(readFileSync(join(sitesDir, f), 'utf-8')));

  for (const site of sites) validateSite(site);

  const seenIds = new Set();
  for (const site of sites) {
    if (seenIds.has(site.id)) throw new Error(`id de sitio duplicado: "${site.id}"`);
    seenIds.add(site.id);
  }

  return sites;
}
