import { chromium } from 'playwright';
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const base = process.env.BOOK_PREVIEW_URL ?? 'http://127.0.0.1:4321';
const output = new URL('../../revisions/verification/.artifacts/reading/', import.meta.url);
mkdirSync(output, { recursive: true });
const slugs = readdirSync(new URL('../src/content/modules/', import.meta.url)).filter(n=>/^ch\d+.*\.mdx$/.test(n)&&!n.includes('.python.')).map(n=>n.replace(/\.mdx$/,''));
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.addInitScript(() => localStorage.setItem('pi-agent-book:lang', 'python'));
const page = await context.newPage();
const errors = [], findings = [], targets = new Set();
page.on('pageerror',e=>errors.push(String(e)));
page.on('response',r=> { if(r.url().startsWith(base)&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`); });
try {
  await page.goto(base);
  assert.equal(await page.locator('a[href*="/python"]').count(),0,'Home should guide to TS');
  for(let index=0; index<slugs.length;index++) {
    const slug=slugs[index];
    assert.equal((await page.goto(`${base}/modules/${slug}`)).status(),200);
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('figure.diagram')).every(f=>f.querySelector('svg')));
    assert.equal(await page.locator('.language-switcher').count(),0);
    assert.match(await page.locator('header.module-header').innerText(),/0\.87\.1/);
    const nav=await page.locator('.prevnext a').evaluateAll(as=>as.map(a=>a.getAttribute('href')));
    assert.deepEqual(nav,[slugs[index-1],slugs[index+1]].filter(Boolean).map(s=>`/modules/${s}`));
    assert.equal(await page.locator('#left-toc a').count(),10);
    assert.equal(await page.locator('#left-toc a[href*="python"]').count(),0);
    assert.ok(await page.locator('.outline-right a').count()>0,`${slug}: missing outline`);
    const brokenAnchors=await page.locator('.outline-right a[href*="#"]').evaluateAll(as=>as.flatMap(a=>{
      const id=decodeURIComponent(new URL(a.href).hash.slice(1));
      return id&&!document.getElementById(id)?[id]:[];
    }));
    assert.deepEqual(brokenAnchors,[],`${slug}: broken outline targets`);
    const localLinks=await page.locator('a[href]').evaluateAll(as=>as.map(a=>new URL(a.getAttribute('href'),location.href).href).filter(h=>h.startsWith(location.origin)));
    localLinks.forEach(h=>targets.add(h.split('#')[0]));
    const diagramIssues=await page.locator('figure.diagram svg').evaluateAll(svgs=>svgs.flatMap(svg=>{
      const view=svg.viewBox.baseVal;
      return Array.from(svg.querySelectorAll('text')).flatMap(t=>{
        const b=t.getBBox();
        const x=Number(t.getAttribute('x'));
        const max=x===58?320:x===367?908:view.width-20;
        return b.x+b.width>max||b.y+b.height>view.height?`${svg.closest('figure').dataset.diagramId}: ${t.textContent}`:[];
      });
    }));
    findings.push({slug,diagrams:await page.locator('figure.diagram svg').count(),diagramIssues});
  }
  writeFileSync(new URL('diagram-results.json',output),JSON.stringify(findings,null,2));
  // 历史页面直达可用，目录与上下章沿 Python 路径行进。
  for(const slug of slugs) {
    assert.equal((await page.goto(`${base}/modules/${slug}/python`)).status(),200);
    assert.match(await page.locator('.python-notice').innerText(),/历史.*0\.80\.2/s);
    assert.equal(await page.locator('.python-notice a').getAttribute('href'),`/modules/${slug}`);
    assert.equal(await page.locator('#left-toc a[href$="/python"]').count(),10);
    assert.equal(await page.locator('.prevnext a:not([href$="/python"])').count(),0);
  }
  await page.goto(`${base}/modules/pr03-model-config`);
  assert.equal(await page.locator('#left-toc a').count(),7);
  assert.equal(await page.locator('#left-toc a:not([href*="/pr"])').count(),0);
  for(const slug of slugs.filter(s=>/^ch(03|06|07|10)-/.test(s))) {
    for(const mobile of [false,true]) for(const theme of ['light','dark']) {
      await page.setViewportSize(mobile?{width:390,height:844}:{width:1440,height:1000});
      await page.goto(`${base}/modules/${slug}`);
      await page.evaluate(value=>{document.documentElement.dataset.theme=value;localStorage.setItem('pi-agent-book:theme',value);},theme);
      await page.waitForFunction(()=>!!document.querySelector('figure.diagram svg'));
      const figure=page.locator('figure.diagram').first();
      await figure.scrollIntoViewIfNeeded();
      await page.mouse.move(0,0);
      await page.evaluate(()=>document.fonts.ready);
      await page.waitForTimeout(350); // 等待主题和 SVG 反相过渡完成后检查最终画面。
      await page.screenshot({animations:'disabled',path:new URL(`${slug}-${mobile?'mobile':'desktop'}-${theme}.png`,output).pathname.replace(/^\/([A-Z]:)/,'$1')});
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
      assert.equal(overflow,false,`${slug} ${mobile?'mobile':'desktop'} overflow`);
      assert.ok(await page.locator('pre').count()>0);
      assert.ok(await page.locator('.outline-right a').count()>0);
      await figure.click();
      await page.waitForSelector('#diagram-lightbox.is-open');
      await page.keyboard.press('Escape');
      await page.waitForSelector('#diagram-lightbox.is-open',{state:'hidden'});
    }
  }
  const badLinks=[];
  for(const url of targets) { const response=await context.request.get(url); if(response.status()>=400)badLinks.push(`${response.status()} ${url}`); }
  writeFileSync(new URL('results.json',output),JSON.stringify({findings,errors,badLinks,screenshots:16},null,2));
  assert.deepEqual(errors,[]);
  assert.deepEqual(badLinks,[]);
  assert.deepEqual(findings.flatMap(f=>f.diagramIssues),[]);
  console.log(`Reading checks passed: 10 TS + 10 historical Python + practice navigation; ${targets.size} local link targets; 16 viewport/theme screenshots.`);
} finally { await browser.close(); }
