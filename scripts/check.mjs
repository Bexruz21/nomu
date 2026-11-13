import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {load} from 'cheerio';
import sharp from 'sharp';

const root=path.resolve('dist'),origin='https://nomu.uz';
const sitemap=await fs.readFile(path.join(root,'sitemap.xml'),'utf8');
const xml=load(sitemap,{xmlMode:true});
const urls=xml('loc').map((_,el)=>xml(el).text()).get();
assert.equal(new Set(urls).size,15,'Expected 3 home pages and 12 service pages, without duplicate URLs.');
assert.match(await fs.readFile(path.join(root,'robots.txt'),'utf8'),/Sitemap: https:\/\/nomu\.uz\/sitemap.xml/);
assert.doesNotMatch(await fs.readFile(path.join(root,'robots.txt'),'utf8'),/Disallow:\s*\/(?:\s|$)/);
const parsed=new Map(),titles=new Set(),descriptions=new Set();
const localFile=url=>path.join(root,url.pathname.endsWith('/')?`${url.pathname}index.html`:url.pathname);
for(const url of urls) {
  assert.ok(url.startsWith(origin+'/'));
  const doc=load(await fs.readFile(localFile(new URL(url)),'utf8'));
  parsed.set(url,doc);
  assert.equal(doc('h1').length,1,`${url}: one H1`);
  assert.ok(doc('main').text().trim().length>500,`${url}: meaningful HTML content without JS`);
  assert.equal(doc('[data-lang]').length,0,`${url}: no hidden translated duplicates`);
  assert.equal(doc('link[rel="canonical"]').attr('href'),url,`${url}: self canonical`);
  const lang=doc('html').attr('lang');
  assert.equal(lang,url.includes('/ru/')?'ru':url.includes('/en/')?'en':'uz');
  assert.equal(doc('meta[property="og:url"]').attr('content'),url);
  assert.ok(!doc('meta[name="robots"]').attr('content').includes('noindex'));
  const title=doc('title').text(),description=doc('meta[name="description"]').attr('content');
  assert.ok(title.length>=20&&title.length<=85,`${url}: title length ${title.length}`);
  assert.ok(description.length>=80&&description.length<=190,`${url}: description length ${description.length}`);
  assert.ok(!titles.has(title),`${url}: unique title`);titles.add(title);
  assert.ok(!descriptions.has(description),`${url}: unique description`);descriptions.add(description);
  const data=JSON.parse(doc('script[type="application/ld+json"]').text());
  assert.equal(data['@context'],'https://schema.org');
  assert.ok(data['@graph'].some(item=>item['@type']==='Organization'&&item.name==='NOMU'));
  assert.ok(data['@graph'].some(item=>item['@type']==='WebPage'&&item.url===url&&item.inLanguage===lang));
  const ids=doc('[id]').map((_,el)=>doc(el).attr('id')).get();assert.equal(new Set(ids).size,ids.length,`${url}: unique IDs`);
  for(const el of doc('a[href],link[href],img[src],script[src]').toArray()) {
    const target=doc(el).attr('href')||doc(el).attr('src');
    if(/^(https?:|mailto:|tel:)/.test(target)&&!target.startsWith(origin))continue;
    const resolved=new URL(target,url);
    if(resolved.origin!==origin)continue;
    await fs.access(localFile(resolved));
    if(resolved.hash) {
      const linked=resolved.pathname===new URL(url).pathname?doc:load(await fs.readFile(localFile(resolved),'utf8'));
      assert.equal(linked(`[id="${resolved.hash.slice(1)}"]`).length,1,`${url}: working anchor ${target}`);
    }
  }
  for(const el of doc('img').toArray()) {
    assert.ok(doc(el).attr('alt')!==undefined);
    assert.ok(Number(doc(el).attr('width'))>0&&Number(doc(el).attr('height'))>0,`${url}: intrinsic image size`);
  }
  for(const el of doc('input,select,textarea').toArray()) assert.equal(doc(`label[for="${doc(el).attr('id')}"]`).length,1);
}
for(const [url,doc] of parsed) {
  const alternates=doc('link[rel="alternate"][hreflang]');
  assert.equal(alternates.length,4);
  for(const el of alternates.toArray()) {
    const lang=doc(el).attr('hreflang'),target=doc(el).attr('href');
    assert.ok(parsed.has(target),`${url}: alternate exists ${target}`);
    if(lang!=='x-default')assert.equal(parsed.get(target)('html').attr('lang'),lang);
    assert.equal(parsed.get(target)(`link[hreflang="${doc('html').attr('lang')}"]`).attr('href'),url,`${url}: reciprocal hreflang`);
  }
}
for(const size of [32,48,96,192,512]) {const meta=await sharp(path.join(root,`favicon-${size}.png`)).metadata();assert.equal(meta.width,size);assert.equal(meta.height,size);}
const og=await sharp(path.join(root,'assets/nomu-social.png')).metadata();assert.equal(og.width,1200);assert.equal(og.height,630);
const ico=await fs.readFile(path.join(root,'favicon.ico'));assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),3);
const js=await fs.readFile(path.join(root,'assets/site.js'),'utf8');new vm.Script(js);
assert.doesNotMatch(js,/localStorage\.getItem/,'URL language must not be overridden by stored preferences.');
assert.doesNotMatch(js,/TELEGRAM_CONFIG|api\.telegram\.org|\d{8,12}:[A-Za-z0-9_-]{30,}/,'Browser code must not contain Telegram credentials.');
assert.match(js,/fetch\('\/api\/contact'/,'Contact form must use the server endpoint.');
assert.doesNotMatch(js,/\.\/images\/clients/,'Ticker must use optimized assets.');
const missing=await fs.access(path.join(root,'src')).then(()=>false,()=>true);assert.ok(missing,'Source templates are excluded from deployment.');
const manifest=JSON.parse(await fs.readFile('assets/images/manifest.json','utf8'));
let before=0,after=0;
for(const [file,item] of Object.entries(manifest)) {before+=(await fs.stat(path.join('images',file))).size;after+=(await fs.stat(path.join(root,item.src))).size;}
console.log(`PASS: ${urls.length} pages; languages, reciprocal hreflang, canonical, JSON-LD, internal links, images, forms and JavaScript.`);
console.log(`Images: ${(before/1e6).toFixed(2)} MB → ${(after/1e6).toFixed(2)} MB (${Math.round((1-after/before)*100)}% smaller).`);
