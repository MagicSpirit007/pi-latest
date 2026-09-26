// 用固定发布快照核对源码引用；不读取当前 Pi 工作区 HEAD。
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const root = process.argv[2];
if (!root) throw new Error('Usage: node verify-sources.mjs <v0.87.1 snapshot>');
const commit = 'f07218c4d4bbc12bef056a7058c3dd49dfe41abe';
assert.equal(JSON.parse(readFileSync(join(root,'packages/agent/package.json'),'utf8')).version, '0.87.1');
const modules = new URL('../web/src/content/modules/', import.meta.url);
const sources = JSON.parse(readFileSync(new URL('./source-map.json', import.meta.url), 'utf8'));
const issues = []; let links = 0, diagrams = 0;
for (const [,path,,needle,line] of sources) {
  if (!existsSync(join(root,path))) issues.push(`Missing source ${path}`);
  else if (needle && !readFileSync(join(root,path),'utf8').split(/\r?\n/)[line-1]?.includes(needle)) issues.push(`Wrong source line ${path}:${line}`);
}
for(const name of readdirSync(modules).filter(n=>/^ch\d+.*\.mdx$/.test(n)&&!n.includes('.python.'))) {
  const body = readFileSync(new URL(name,modules),'utf8');
  for(const match of body.matchAll(/https:\/\/github\.com\/(?:earendil-works\/pi|badlogic\/pi-mono)\/blob\/([^/]+)\/([^)\s#]+)(?:#L(\d+))?/g)) {
    links++;
    if(match[1]!==commit) issues.push(`${name}: unpinned link ${match[0]}`);
    if(!existsSync(join(root,match[2]))) issues.push(`${name}: missing link target ${match[2]}`);
    if(match[3] && !sources.some(([,p,,,line])=>p===match[2]&&line===Number(match[3]))) issues.push(`${name}: unverified line ${match[0]}`);
  }
  for(const [,path] of body.matchAll(/\b(packages\/[a-zA-Z0-9_./-]+\.(?:ts|json|md))\b/g)) {
    if(!existsSync(join(root,path))) issues.push(`${name}: missing quoted path ${path}`);
  }
  for(const [,file] of body.matchAll(/<Diagram file="\/assets\/([^"]+)"/g)) {
    diagrams++;
    const svg=readFileSync(new URL('../web/public/assets/'+file,import.meta.url),'utf8');
    assert.equal(svg,readFileSync(new URL('../pi_source_dive/typescript/assets/'+file,import.meta.url),'utf8'));
    for(const [,path] of svg.matchAll(/https:\/\/github\.com\/earendil-works\/pi\/blob\/[^/]+\/([^"]+)/g)) if(!existsSync(join(root,path))) issues.push(`${file}: missing source ${path}`);
  }
}
if(issues.length) { console.error([...new Set(issues)].join('\n')); process.exit(1); }
assert.equal(diagrams,25);
console.log(`Source audit passed: ${sources.length} index entries, ${links} fixed-commit links, ${diagrams} paired diagrams.`);
