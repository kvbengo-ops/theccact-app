import { defineConfig } from 'astro/config';
import { loadLivePartners } from './src/lib/partner-source.mjs';

export default defineConfig({
  output: 'static',
  integrations: [{
    name: 'validate-partners',
    hooks: { 'astro:build:start': () => loadLivePartners({ url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY, required: process.env.CF_PAGES === '1' }) },
  }],
});
