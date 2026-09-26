// scripts/check-counterpart.mjs
// 校验 src/content/modules/ 下所有 mdx 文件的 TS/Python 双版本 frontmatter 一致性。
// 依赖 gray-matter 解析 YAML frontmatter（支持嵌套对象/数组）。
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
// 可选目录参数用于隔离的校验器回归样例。
const MODULES_DIR = process.argv[2] ?? join(__dirname, '..', 'src', 'content', 'modules');

// gray-matter 解析：返回 { data: frontmatter 对象, content: 正文 }
function parseFrontmatter(content) {
  const parsed = matter(content);
  return parsed.data;
}

const files = readdirSync(MODULES_DIR).filter(f => f.endsWith('.mdx'));
const errors = [];
let pythonMissingCount = 0;
const identityKeys = ['title', 'module', 'displayOrder', 'prev', 'next'];
const fieldKeysToCompare = [
  'title', 'module', 'displayOrder', 'status', 'summary',
  'prev', 'next', 'keyPoints', 'furtherReading', 'simulator', 'diagrams',
];

for (const file of files) {
  const content = readFileSync(join(MODULES_DIR, file), 'utf-8');
  const fm = parseFrontmatter(content);

  // B4: Python variant files must declare slug ending in .python
  // This catches silent route breakage when Astro strips dots from filename slugs.
  if (file.endsWith('.python.mdx')) {
    if (!fm.slug || !fm.slug.endsWith('.python')) {
      errors.push(
        `[${file}] Python 变体缺少正确的 slug：frontmatter 中 slug 必须以 ".python" 结尾` +
        `（当前值：${fm.slug ? `"${fm.slug}"` : '（未设置）'}）。` +
        `Astro 会从文件名生成 slug，点号被剥离导致路由不匹配。`
      );
    }
  }

  if (!fm || !fm.counterpart) {
    // TS 文件未声明 counterpart（即没有 Python 版）—— 计入 pythonMissingCount
    if (fm && fm.variant !== 'python' && !file.endsWith('.python.mdx')) {
      pythonMissingCount++;
    }
    continue;
  }

  const counterpartFile = fm.counterpart + '.mdx';
  const counterpartPath = join(MODULES_DIR, counterpartFile);
  if (!existsSync(counterpartPath)) {
    errors.push(`[${file}] 声明的 counterpart 不存在：${counterpartFile}`);
    continue;
  }

  const counterpartContent = readFileSync(counterpartPath, 'utf-8');
  const counterpartFm = parseFrontmatter(counterpartContent);
  if (!counterpartFm) {
    errors.push(`[${counterpartFile}] frontmatter 解析失败`);
    continue;
  }

  // Navigation identities must exist in the same series and pair in both languages.
  for (const key of ['prev', 'next']) {
    if (!fm[key]) continue;
    const adjacentPath = join(MODULES_DIR, fm[key].replace(/\.python$/, '') + (fm.variant === 'python' ? '.python' : '') + '.mdx');
    if (!existsSync(adjacentPath)) errors.push(`[${file}] ${key} 目标不存在：${fm[key]}`);
    else {
      const adjacent = parseFrontmatter(readFileSync(adjacentPath, 'utf8'));
      if ((adjacent.book ?? 'internals') !== (fm.book ?? 'internals')) errors.push(`[${file}] ${key} 跨系列`);
      const reverse = key === 'prev' ? 'next' : 'prev';
      if (adjacent[reverse]?.replace(/\.python$/, '') !== file.replace(/(?:\.python)?\.mdx$/, '')) errors.push(`[${file}] ${key} 导航不双向`);
    }
  }

  // 双向校验
  const mySlug = file.replace(/\.mdx$/, '');
  if (counterpartFm.counterpart !== mySlug) {
    errors.push(`[${file}] 双向 counterpart 不一致：本文件指向 "${fm.counterpart}"，对方指向 "${counterpartFm.counterpart}"`);
    continue;
  }

  // 字段深比较（序列化后比对）
  if ((fm.variant ?? 'ts') === (counterpartFm.variant ?? 'ts')) errors.push(`[${file}] counterpart 必须指向另一语言`);
  if ((fm.book ?? 'internals') !== (counterpartFm.book ?? 'internals')) errors.push(`[${file}] counterpart 不能跨系列`);
  const sameVersion = (fm.sourceVersion ?? '0.80.2') === (counterpartFm.sourceVersion ?? '0.80.2');
  for (const key of sameVersion ? fieldKeysToCompare : identityKeys) {
    const a = JSON.stringify(fm[key] ?? null);
    const b = JSON.stringify(counterpartFm[key] ?? null);
    if (a !== b) {
      errors.push(`[${file}] 与 [${counterpartFile}] 字段 "${key}" 不一致\n  TS: ${a}\n  PY: ${b}`);
    }
  }
}

if (errors.length > 0) {
  console.error('\n❌ counterpart 校验失败：\n');
  for (const e of errors) console.error('  ' + e + '\n');
  process.exit(1);
}

const pythonCount = files.filter(f => f.endsWith('.python.mdx')).length;
console.log(`✓ counterpart 校验通过（扫描 ${files.length} 个 mdx 文件，${pythonCount} 个 Python 版，${pythonMissingCount} 个 TS 版暂无 Python counterpart）`);
