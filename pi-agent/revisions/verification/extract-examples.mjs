import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const modules = new URL('../../web/src/content/modules/', import.meta.url);
const output = new URL('./examples/', import.meta.url);
mkdirSync(output, { recursive: true });
let count = 0;
for (const name of readdirSync(modules).filter(n => /^ch\d+.*\.mdx$/.test(n) && !n.includes('.python.'))) {
  const text = readFileSync(new URL(name, modules), 'utf8');
  let index = 0;
  for (const match of text.matchAll(/```typescript\r?\n([\s\S]*?)```/g)) {
    if (!match[1].includes('// 完整示例')) continue;
    const target = new URL(`${name.slice(0, 4)}-${++index}.ts`, output);
    writeFileSync(target, `// 自动从 ${name} 抽取；请修改 MDX 后重新生成。\n${match[1]}`);
    count++;
  }
}
if (count !== 9) throw new Error(`Expected 9 complete examples, got ${count}`);
console.log(`Extracted ${count} examples to ${fileURLToPath(output)}`);
