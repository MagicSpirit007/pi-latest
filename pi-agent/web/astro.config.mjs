// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { visit } from 'unist-util-visit';

// 部署适配：默认部署在域名根路径（Cloudflare Pages）；
// GitHub Pages 项目站点用 SITE_BASE=/<repo> 注入子路径。
const SITE_URL = process.env.SITE_URL ?? 'https://dg-ai-notes.pages.dev';
const SITE_BASE = process.env.SITE_BASE ?? '/';

/**
 * MDX/Markdown 里的站内绝对链接（`](/modules/xxx)`）不会自动带 base，
 * 子路径部署时会 404。这里在编译期统一补上。
 */
function rehypeBasePath() {
  const prefix = SITE_BASE.replace(/\/+$/, '');
  return (tree) => {
    if (!prefix) return;
    visit(tree, 'element', (node) => {
      for (const key of ['href', 'src']) {
        const value = node.properties?.[key];
        if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) continue;
        if (value === prefix || value.startsWith(`${prefix}/`)) continue;
        node.properties[key] = `${prefix}${value}`;
      }
    });
  };
}

export default defineConfig({
  integrations: [
    mdx({
      gfm: true,
      rehypePlugins: [rehypeBasePath],
    }),
    react(),
  ],
  site: SITE_URL,
  base: SITE_BASE,
  devToolbar: { enabled: false },
  markdown: {
    shikiConfig: {
      theme: 'one-dark-pro',
      wrap: true,
    },
  },
  experimental: { clientPrerender: true },
});
