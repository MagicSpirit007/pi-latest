// MDX 是权威源；只更新源码精读 TS 快照，保留 Python 与实战篇。
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import matter from 'gray-matter';

const modules = new URL('../src/content/modules/', import.meta.url);
const snapshots = new URL('../../pi_source_dive/typescript/', import.meta.url);
const names = readdirSync(snapshots);
const pairs = readdirSync(modules)
  .filter(n => /^ch\d+.*\.mdx$/.test(n) && !n.includes('.python.'))
  .map(name => {
    const n = Number(name.slice(2, 4));
    const md = names.find(f => f.startsWith(`第${n}章-`) && f.endsWith('.md'));
    if (!md) throw new Error(`Missing TS snapshot: ${name}`);
    return { name, md, slug: name.replace(/\.mdx$/, '') };
  });
if (pairs.length !== 10) throw new Error('Expected 10 TS chapters');
for (const {name, md} of pairs) {
  const { data, content } = matter(readFileSync(new URL(name, modules), 'utf8'));
  let body = content.replace(/^import\s+\w+\s+from\s+['"][^'"\n]*\.astro['"];?\s*$/gm, '')
    .replace(/<Diagram\b[^>]*file="([^"]*)"[^>]*caption="([^"]*)"[^>]*\/>/g, (_, file, caption) => `![${caption}](assets/${file.split('/').pop()})`);
  for (const pair of pairs) body = body.replaceAll(`](/modules/${pair.slug})`, `](${pair.md})`);
  // 其他系列仍使用在线站点路由，不假造本地 Markdown 配对。
  body = body.replace(/\]\(\/modules\//g, '](https://dg-ai-notes.pages.dev/modules/');
  writeFileSync(new URL(md, snapshots), `# ${data.title}\n\n${body.trim()}\n`);
}
console.log('Synced 10 TypeScript chapters.');
