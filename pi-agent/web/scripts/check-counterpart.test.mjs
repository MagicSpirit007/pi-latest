import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const script = fileURLToPath(new URL('./check-counterpart.mjs',import.meta.url));
function check({sameVersion=false,sameContent=false,brokenPair=false,brokenNav=false}={}) {
  const dir=mkdtempSync(join(tmpdir(),'pi-book-counterpart-'));
  const common={title:'第1章：开篇',module:'M01',displayOrder:1,status:'published'};
  const ts={...common,variant:'ts',sourceVersion:'0.87.1',summary:'current',diagrams:[{id:'new',file:'/new.svg'}],counterpart:'ch01.python',...(brokenNav?{next:'missing'}:{})};
  const py={...common,slug:'ch01.python',variant:'python',sourceVersion:sameVersion?'0.87.1':'0.80.2',summary:sameContent?ts.summary:'historical',diagrams:sameContent?ts.diagrams:[{id:'old',file:'/old.svg'}],counterpart:brokenPair?'missing':'ch01'};
  // JSON 是合法 YAML；夹具只测元数据，不复制真实章节。
  const paths=[join(dir,'ch01.mdx'),join(dir,'ch01.python.mdx')];
  try {
    [ts,py].forEach((data,i)=>writeFileSync(paths[i],`---\n${JSON.stringify(data)}\n---\nFixture\n`));
    return spawnSync(process.execPath,[script,dir],{encoding:'utf8'});
  } finally { paths.forEach(p=>unlinkSync(p)); rmdirSync(dir); }
}
test('跨版本允许摘要与配图独立变化',()=>assert.equal(check().status,0));
test('同版本仍拒绝摘要与配图漂移',()=>assert.notEqual(check({sameVersion:true}).status,0));
test('同版本相同元数据通过',()=>assert.equal(check({sameVersion:true,sameContent:true}).status,0));
test('跨版本仍要求双向配对',()=>assert.notEqual(check({brokenPair:true}).status,0));
test('跨版本仍要求导航存在',()=>assert.notEqual(check({brokenNav:true}).status,0));
