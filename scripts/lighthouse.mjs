// Lighthouse for the production build: node scripts/lighthouse.mjs <baseUrl> [--desktop|--all] [--every]
// Default: one route per page template. --every: every prerendered page. LH_ROUTES='/a /b': only those (space-separated: routes may contain commas).
// JSON reports go to /tmp/lh. Exit 1 if any score is below 100.
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import * as chromeLauncher from 'chrome-launcher';
import { mkdirSync, writeFileSync } from 'node:fs';
import articles from '../data/articles.json' with { type: 'json' };
import products from '../data/products.json' with { type: 'json' };
import knowledge from '../data/knowledge.json' with { type: 'json' };
import presets from '../lib/zve10/presets.json' with { type: 'json' };
import paths from '../data/learning-paths.json' with { type: 'json' };

const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
// Note URLs follow lib/wiki.ts entryHref: knowledge notes under /blog/kien-thuc, merged notes live inside their article.
const notePath = (k) => (k.home === 'knowledge' ? `/blog/kien-thuc/${k.slug}` : k.home === 'product' ? `/wiki/san-pham/${k.slug}` : k.group === 'post' ? `/blog/${k.slug}` : null);
const notes = knowledge.map(notePath).filter(Boolean);
// Learning paths stay drafts until the user approves them: none may be published yet.
const published = paths.filter((p) => !p.draft).map((p) => `/blog/lo-trinh/${p.slug}`);
const TEMPLATES = ['/', '/cai-tay/phoi-sang', '/tao-m1-m4', '/giai-ma', '/colors', '/colors/pp-001', '/colors/graph', '/wiki', `/wiki/san-pham/${products[0].slug}`, `/wiki/san-pham/so-sanh?sp=${products[0].slug},${products[1].slug}`, '/blog/kien-thuc', notes[0], '/blog', `/blog/${articles[0].id}`, ...published.slice(0, 1), '/graph', '/search', '/skill'];
const EVERY = [
  ...new Set([...TEMPLATES, ...presets.map((p) => `/colors/${p.id}`), ...products.map((p) => `/wiki/san-pham/${p.slug}`), ...notes, ...articles.map((a) => `/blog/${a.id}`), ...published]),
];

const args = process.argv.slice(2);
const baseUrl = args.find((a) => !a.startsWith('--')) ?? 'http://localhost:3100';
const routes = process.env.LH_ROUTES?.split(/\s+/).filter(Boolean) ?? (args.includes('--every') ? EVERY : TEMPLATES);
const formFactors = args.includes('--all') ? ['mobile', 'desktop'] : args.includes('--desktop') ? ['desktop'] : ['mobile'];

mkdirSync('/tmp/lh', { recursive: true });
const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox'], chromePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome' });
const rows = [];
try {
  for (const formFactor of formFactors) {
    for (const route of routes) {
      const flags = { logLevel: 'error', output: 'json', onlyCategories: CATEGORIES, port: chrome.port };
      // The node API ignores a `preset` flag: desktop needs its config object
      const { lhr } = await lighthouse(`${baseUrl}${route}`, flags, formFactor === 'desktop' ? desktopConfig : undefined);
      writeFileSync(`/tmp/lh/${formFactor}-${route.replace(/\//g, '_') || 'index'}.json`, JSON.stringify(lhr));
      const scores = CATEGORIES.map((c) => Math.round((lhr.categories[c]?.score ?? 0) * 100));
      const failing = Object.entries(lhr.audits)
        .filter(([, a]) => a.score !== null && a.score < 1 && !['notApplicable', 'informative', 'manual'].includes(a.scoreDisplayMode))
        .map(([id]) => id);
      rows.push({ formFactor, route, scores, failing });
      console.log(`[${formFactor}] ${route} ${scores.join(' ')}${failing.length ? `  failing: ${failing.join(', ')}` : ''}`);
    }
  }
} finally {
  await chrome.kill();
}

console.log(`\n${'form'.padEnd(8)}${'route'.padEnd(48)}${CATEGORIES.map((c) => c.slice(0, 4).padEnd(6)).join('')}`);
for (const r of rows) console.log(`${r.formFactor.padEnd(8)}${r.route.padEnd(48)}${r.scores.map((s) => String(s).padEnd(6)).join('')}`);
const below = rows.filter((r) => r.scores.some((s) => s < 100));
console.log(below.length ? `\n${below.length} of ${rows.length} runs below 100` : `\nAll ${rows.length} runs at 100`);
process.exit(below.length ? 1 : 0);
