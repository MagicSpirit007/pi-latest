import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const commit = 'f07218c4d4bbc12bef056a7058c3dd49dfe41abe';
const definitions = JSON.parse(readFileSync(new URL('./diagrams-v0871.json', import.meta.url), 'utf8'));
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
function text(x, y, value, cls = '') { return `<text x="${x}" y="${y}" class="${cls}">${esc(value)}</text>`; }
function box(x,y,w,h,fill='#fffdf9') { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="${fill}" stroke="#d6cec3"/>`; }
for (const [key,title,kind,rows,note,source] of definitions) {
  const id = `260925-${key}`;
  const height = kind === 'tree' ? 610 : Math.max(470, 220 + rows.length * 100);
  let body = text(42,48, title,'title') + text(42,78,'PI SOURCE DIVE  /  v0.87.1','eyebrow');
  if (kind === 'tree') {
    const nodes = [[360,108,'e1 · model_change'],[360,188,'e2 · user'],[100,298,'e3 · assistant'],[100,378,'e4 · toolResult'],[100,458,'e5 · assistant'],[610,298,'e6 · 新 user']];
    body += '<path d="M480 162V188 M480 242V265H220V298 M480 265H730V298 M220 352V378 M220 432V458" class="edge"/>';
    for(const [x,y,label] of nodes) body+=box(x,y,240,54,label.includes('新')?'#ecf0e7':'#fffdf9')+text(x+18,y+34,label,'node');
    body += text(630,398,'leafId → e6','accent') + text(590,433,'旧分支未被删除','small');
  } else if (kind === 'budget') {
    body += text(42,125,'压缩前（示意）','node') + box(42,143,690,52,'#ebd8cd') + box(740,143,115,52,'#e1e8d9');
    body += text(66,177,'旧对话 120k','node') + text(750,177,'近期 20k','small');
    body += text(42,242,'压缩后（示意）','node')+box(42,260,68,52,'#ebd8cd')+box(118,260,115,52,'#e1e8d9');
    body += text(45,294,'3k','node')+text(128,294,'近期 20k','small');
    body += text(340,294,'原始历史仍在会话文件中','node');
    body += text(42,374,'请求使用：系统检查点 + 摘要 + 保留消息','node');
  } else {
    rows.forEach(([label, lines],i)=>{
      const y=108+i*100;
      if(i && kind !== 'compare' && !label.includes('侧库')) body+=`<path d="M185 ${y-18}V${y-3}" class="edge"/>`;
      body+=box(42,y,290,82,kind==='compare'?'#ede9e1':'#f0e8df')+box(350,y,568,82);
      body+=text(58,y+47,label,'node');
      lines.forEach((line,j)=>body+=text(367,y+(lines.length===1?47:32)+j*28,line,'body'));
      if(kind!=='compare') body+=`<path d="M332 ${y+41}H346" class="edge"/>`;
    });
  }
  const noteLines = note.length > 52 ? [note.slice(0,52),note.slice(52)] : [note];
  noteLines.forEach((line,i)=>body+=text(42,height-80+i*23,line,'small'));
  body+=`<a href="https://github.com/earendil-works/pi/blob/${commit}/${source}" target="_blank">${text(42,height-22,source,'source')}</a>`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 ${height}" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${esc(title)}</title><desc id="${id}-desc">${esc(note)}</desc><defs><marker id="${id}-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill="#8e7767"/></marker></defs><style>text{font-family:Geist,"Microsoft YaHei",sans-serif;fill:#1c1917}.title{font-size:29px;font-weight:650}.eyebrow{font:13px Geist,monospace;letter-spacing:2px;fill:#8a7464}.node{font-size:19px;font-weight:600}.body{font-size:18px}.small{font-size:17px;fill:#57534e}.accent{font-size:23px;fill:#b5523a}.source{font:13px Geist,monospace;fill:#8a7464}.edge{fill:none;stroke:#8e7767;stroke-width:1.8;marker-end:url(#${id}-arrow)}</style><rect width="960" height="${height}" fill="#faf7f2"/>${body}</svg>\n`;
  for(const dir of ['../web/public/assets/','../pi_source_dive/typescript/assets/']) {
    mkdirSync(new URL(dir,import.meta.url),{recursive:true});
    writeFileSync(new URL(`${dir}${id}.svg`,import.meta.url),svg);
  }
}
console.log(`Generated ${definitions.length} diagrams in both destinations.`);
