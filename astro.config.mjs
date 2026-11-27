import { defineConfig } from 'astro/config';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { loadLivePartners } from './src/lib/partner-source.mjs';
import { SITE_BRAND } from './src/lib/links.mjs';
import { CCES_REWRITES } from './src/content/site.mjs';
import { learningOrigin, learningRedirects } from './src/lib/learning-sites.mjs';

export default defineConfig({
  output: 'static',
  integrations: [{
    name: 'validate-partners',
    hooks: { 'astro:build:start': () => loadLivePartners({ url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY, required: process.env.CF_PAGES === '1' }) },
  }, {
    name: 'cces-brand',
    hooks: {
      'astro:build:done': ({ dir }) => {
        if (SITE_BRAND !== 'cces') return;
        // ponytail: plain text swaps over the built pages; `npm run dev` still shows CCACT text (build + preview to see CCES).
        const root = fileURLToPath(dir);
        for (const file of readdirSync(root, { recursive: true })) {
          if (!/\.(html|js)$/.test(file)) continue;
          const path = join(root, file);
          const before = readFileSync(path, 'utf8');
          const after = CCES_REWRITES.reduce((text, [from, to]) => text.replaceAll(from, to), before);
          if (after !== before) writeFileSync(path, after);
        }
      },
    },
  }, {
    name: 'learning-site-routing',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const root = fileURLToPath(dir);
        const app = process.env.SITE_APP;
        const origin = learningOrigin(SITE_BRAND);
        // ponytail: until the learning sites exist, /learn/ stays on the main site; set LEARN_<BRAND>_ORIGIN to move it.
        if (app !== 'learn' && process.env.NETLIFY === 'true' && !origin) {
          console.warn(`LEARN_${SITE_BRAND.toUpperCase()}_ORIGIN is not set: /learn/ is served by this site.`);
        }
        const path = join(root, '_redirects');
        const existing = readFileSync(path, 'utf8');
        const pages = readdirSync(root, { recursive: true }).map((file) => file.replaceAll('\\', '/'));
        writeFileSync(path, learningRedirects({ app, origin, pages, existing }));
      },
    },
  }],
});
