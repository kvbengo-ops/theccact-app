import { validatePartners } from './partners.mjs';
import { SITE_BRAND } from './links.mjs';

// This module is for build-time/server use only. Never import it into browser scripts.
// Each site builds only its own brand's partners (partners.brand).
export async function loadLivePartners({ url, key, required = false, fetcher = fetch, statuses = ['live'], brand = SITE_BRAND } = {}) {
  if (!url && !key && !required) return [];
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required together');
  let endpoint;
  try { endpoint = new URL(url); } catch { throw new Error('Invalid SUPABASE_URL'); }
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== '/') {
    throw new Error('SUPABASE_URL must be an HTTPS project origin');
  }
  endpoint.pathname = '/rest/v1/partners';
  endpoint.searchParams.set('status', statuses.length === 1 ? `eq.${statuses[0]}` : `in.(${statuses.join(',')})`);
  endpoint.searchParams.set('brand', `eq.${brand}`);
  endpoint.searchParams.set('order', 'slug.asc');
  const records = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    endpoint.searchParams.set('offset', String(offset));
    endpoint.searchParams.set('limit', String(pageSize));
    const response = await fetcher(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!response.ok) throw new Error(`Unable to load partners from Supabase (HTTP ${response.status})`);
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error('Invalid Supabase partner response');
    for (const partner of page) {
      if (!statuses.includes(partner.status)) throw new Error(`Supabase returned a non-live or unexpected partner status: ${partner.status}`);
      for (const field of ['image', 'languages', 'services', 'website', 'contactName']) if (partner[field] === null) delete partner[field];
    }
    records.push(...page);
    if (page.length < pageSize) break;
  }
  return validatePartners(records);
}
