import fs from 'node:fs/promises';
import path from 'node:path';
import {load} from 'cheerio';
import {origin,languages,homePaths,ui,services} from '../src/content.mjs';

const original = await fs.readFile('src/home.html','utf8');
const images = JSON.parse(await fs.readFile('assets/images/manifest.json','utf8'));
const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const absolute = route => new URL(route,origin).href;
const languageLinks = (lang,paths) => languages.map(code => `<a class="lang-btn${code===lang?' active':''}" href="${paths[code]}" hreflang="${code}" lang="${code}" aria-label="${{uz:'O‘zbekcha',ru:'Русский',en:'English'}[code]}"${code===lang?' aria-current="page"':''}>${code.toUpperCase()}</a>`).join('');
const cardLinks = lang => services.map(s => `<li><a href="${s.paths[lang]}">${esc(s[lang].name)}</a></li>`).join('');
const organization = {
  '@type':'Organization','@id':`${origin}/#organization`,name:'NOMU',alternateName:'NOMU International Marketing Agency',url:`${origin}/`,
  logo:{'@type':'ImageObject',url:`${origin}/images/logo.png`,width:1133,height:228},
  email:'nomuagencyuz@gmail.com',telephone:'+998200056575',
  sameAs:['https://www.instagram.com/nomu_agency','https://www.linkedin.com/company/nomuz/','https://t.me/nomuagency','https://www.facebook.com/share/1DLNbojKV6/'],
  contactPoint:[{'@type':'ContactPoint',telephone:'+998200056575',contactType:'customer service',availableLanguage:['Uzbek','Russian','English']},{'@type':'ContactPoint',telephone:'+998987759944',contactType:'customer service',availableLanguage:['Uzbek','Russian','English']}]
};

function head(lang,page,paths,service) {
  const t=ui[lang],url=absolute(paths[lang]);
  const graph=[organization,{'@type':'WebSite','@id':`${origin}/#website`,url:`${origin}/`,name:'NOMU',alternateName:'NOMU Marketing Agency',publisher:{'@id':organization['@id']},inLanguage:languages},
    {'@type':'WebPage','@id':`${url}#webpage`,url,name:page.title,description:page.description,inLanguage:lang,isPartOf:{'@id':`${origin}/#website`},about:{'@id':organization['@id']},primaryImageOfPage:{'@type':'ImageObject',url:`${origin}/assets/nomu-social.png`}}];
  if(service) {
    graph.push({'@type':'Service','@id':`${url}#service`,name:page.name,description:page.intro,serviceType:page.name,url,provider:{'@id':organization['@id']}});
    graph.push({'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:t.home,item:absolute(homePaths[lang])},{'@type':'ListItem',position:2,name:page.name,item:url}]});
    graph[2].mainEntity={'@id':`${url}#service`};
  } else {
    graph[2].mainEntity={'@type':'ItemList',itemListElement:services.map((s,i)=>({'@type':'ListItem',position:i+1,name:s[lang].name,url:absolute(s.paths[lang])}))};
  }
  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(page.title)}</title>
  <meta name="description" content="${esc(page.description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="#050d0a">
  <link rel="canonical" href="${url}">
  ${languages.map(code=>`<link rel="alternate" hreflang="${code}" href="${absolute(paths[code])}">`).join('\n  ')}
  <link rel="alternate" hreflang="x-default" href="${absolute(paths.uz)}">
  <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">
  <link rel="icon" href="/favicon-96.png" type="image/png" sizes="96x96">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
  <link rel="manifest" href="/site.webmanifest">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="NOMU">
  <meta property="og:title" content="${esc(page.title)}">
  <meta property="og:description" content="${esc(page.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:locale" content="${t.locale}">
  ${languages.filter(code=>code!==lang).map(code=>`<meta property="og:locale:alternate" content="${ui[code].locale}">`).join('\n  ')}
  <meta property="og:image" content="${origin}/assets/nomu-social.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="NOMU — ${esc(t.kicker)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(page.title)}">
  <meta name="twitter:description" content="${esc(page.description)}">
  <meta name="twitter:image" content="${origin}/assets/nomu-social.png">
  <meta name="twitter:image:alt" content="NOMU — ${esc(t.kicker)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="/style.css">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.css">
  <script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph}).replaceAll('<','\\u003c')}</script>`;
}

function localizedHome(lang) {
  const $=load(original),t=ui[lang];
  $('[data-lang]').each((_,el)=>{ if($(el).attr('data-lang')!==lang) $(el).remove(); else $(el).replaceWith($(el).html()); });
  $('html').attr('lang',lang);
  $('body').attr('class',`lang-${lang}`);
  $('head').html(head(lang,t,homePaths));
  $('script:not([type="application/ld+json"])').remove();
  $('body').append('<script src="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js" defer></script><script src="/assets/site.js" defer></script>');
  $('.lang-switcher').html(languageLinks(lang,homePaths));
  $('#navLinks > .lang-switcher').each((_,el)=>$(el).replaceWith(`<li class="lang-switcher">${$(el).html()}</li>`));
  $('.nav-logo').attr('href',homePaths[lang]).attr('aria-label',`NOMU — ${t.home}`);
  $('#navBurger').attr({'aria-label':t.menu,'aria-controls':'navLinks','aria-expanded':'false'});
  $('#backToTop').attr('aria-label',t.top);
  $('.hero-title').prepend(`<span class="hero-kicker">NOMU — ${esc(t.kicker)}</span>`);
  $('.hero-subtitle').text(t.intro);
  $('.about-text').text(t.about);
  $('#services h2').text(t.servicesHeading); $('#services .section-desc').text(t.servicesIntro);
  $('#team h2').text(t.teamHeading); $('#team .section-desc').text(t.teamIntro);
  $('.team-card').each((i,el)=>{
    const card=$(el);card.find('.team-role').text(t.roles[i]);
    card.find('img').attr('alt',`${card.find('.team-name').text()} — ${t.roles[i]}`);
    card.find('.team-social').remove();
  });
  if(t.industries) $('.niche-item p').each((i,el)=>$(el).text(t.industries[i]));
  if(t.faqAnswers) $('.faq-answer p').each((i,el)=>$(el).text(t.faqAnswers[i]));
  $('#contact h2').text(t.contactHeading);
  $('.footer-brand p').text(t.footer);
  $('a[href="#portfolio"]').attr('href','#partners').text({uz:'Hamkorlar',ru:'Партнёры',en:'Partners'}[lang]);
  $('.footer-links-group').eq(1).find('ul').html(cardLinks(lang));
  $('.service-card').each((i,el)=>{
    const service=services[i];
    $(el).find('h3').html(`<a href="${service.paths[lang]}">${esc(service[lang].name)}</a>`);
    $(el).find('p').text(service[lang].intro);
    $(el).find('.service-hover-line').before(`<a class="service-more" href="${service.paths[lang]}">${esc(t.more)} <span aria-hidden="true">↗</span></a>`);
  });
  $('img').each((_,el)=>{
    const img=$(el),key=img.attr('src').replaceAll('//','/').replace(/^\.\//,'').replace(/^images\//,'');
    const asset=images[key];
    if(!asset) throw new Error(`Unmapped image: ${key}`);
    img.attr({src:asset.src,width:asset.width,height:asset.height,decoding:'async'});
    if(!img.closest('#navbar,#hero').length) img.attr('loading','lazy');
    if(key==='logo.png') img.attr('alt','NOMU');
    if(key==='flag.png') img.attr('alt',`NOMU — ${t.kicker}`);
  });
  $('.form-group').each((_,el)=>{
    const input=$(el).find('input,select,textarea');
    $(el).find('label').attr('for',input.attr('id'));
  });
  $('#formName').attr({autocomplete:'name',maxlength:'120'});$('#formEmail').attr({autocomplete:'email',maxlength:'254'});$('#formPhone').attr({autocomplete:'tel',maxlength:'100'}); $('#formMessage').attr('maxlength','2500');
  $('#formService').html(`<option value="" disabled selected>${esc(t.select)}</option>${services.map(s=>`<option value="${s.id}">${esc(s[lang].name)}</option>`).join('')}<option value="other">${esc(t.other)}</option>`);
  $('#formStatus').attr({role:'status','aria-live':'polite','aria-atomic':'true'});
  $('.social-link').each((_,el)=>{
    const a=$(el),href=a.attr('href');
    const platform=href.includes('instagram')?'Instagram':href.includes('linkedin')?'LinkedIn':href.includes('t.me')?'Telegram':'Facebook';
    a.attr({'aria-label':`NOMU — ${platform}`,rel:'noopener noreferrer'});
  });
  $('i').attr('aria-hidden','true');
  $('.faq-item').each((i,el)=>{
    const answerId=`faq-answer-${i+1}`;
    $(el).find('.faq-question').attr('aria-controls',answerId);
    $(el).find('.faq-answer').attr('id',answerId);
  });
  $('section').first().before('<main id="main-content"></main>');
  $('#main-content').append($('section, #partner-ticker'));
  $('body').prepend(`<a href="#main-content" class="skip-link">${esc(t.skip)}</a>`);
  return $;
}

function servicePage(lang,service) {
  const $=localizedHome(lang),t=ui[lang],s=service[lang];
  $('head').html(head(lang,s,service.paths,service));
  $('.lang-switcher').html(languageLinks(lang,service.paths));
  $('#navbar a[href^="#"],footer a[href^="#"]').each((_,el)=>$(el).attr('href',`${homePaths[lang]}${$(el).attr('href')}`));
  $('body').addClass('service-page');
  $('#main-content').html(`
    <div class="container service-intro">
      <nav class="breadcrumbs" aria-label="${lang==='ru'?'Навигационная цепочка':lang==='uz'?'Sahifa yo‘li':'Breadcrumb'}"><a href="${homePaths[lang]}">${esc(t.home)}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(s.name)}</span></nav>
      <p class="section-label">NOMU / ${esc(t.services)}</p>
      <h1>${esc(s.name)}</h1><p class="service-lead">${esc(s.intro)}</p>
      <a href="${homePaths[lang]}#contact" class="btn btn-primary">${esc(t.contact)} <span aria-hidden="true">↗</span></a>
    </div>
    <div class="container service-content">
      <article class="service-article">
        <section aria-labelledby="included"><h2 id="included">${esc(t.included)}</h2>${s.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}
        <ul class="service-list">${s.deliverables.map(p=>`<li>${esc(p)}</li>`).join('')}</ul></section>
        <section aria-labelledby="fit"><h2 id="fit">${esc(t.fit)}</h2><p>${esc(s.fit)}</p></section>
        <section aria-labelledby="process"><h2 id="process">${esc(t.process)}</h2><ol class="process-list">${t.processSteps.map(p=>`<li>${esc(p)}</li>`).join('')}</ol></section>
        <section aria-labelledby="questions"><h2 id="questions">${esc(t.questions)}</h2>${s.faq.map(([q,a])=>`<details class="service-faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>
        <section aria-labelledby="brief"><h2 id="brief">${esc(t.brief)}</h2><p>${esc(t.briefText)}</p></section>
      </article>
      <aside class="service-sidebar"><p class="section-label">NOMU</p><h2>${esc(t.contact)}</h2><p>${esc(t.ctaText)}</p><a href="${homePaths[lang]}#contact" class="btn btn-primary">${esc(t.contact)}</a><a class="service-phone" href="tel:+998200056575">+998 20 005 6575</a><a class="service-phone" href="https://t.me/nomuagency">Telegram: @nomuagency</a></aside>
    </div>
    <section class="section related-services"><div class="container"><h2 class="section-title">${esc(t.related)}</h2><div class="related-grid">${services.filter(x=>x.id!==service.id).map(other=>`<a class="related-card" href="${other.paths[lang]}"><span>${esc(other[lang].name)}</span><span aria-hidden="true">↗</span></a>`).join('')}</div></div></section>`);
  return $;
}

// Keep the established interactions, but language is now determined by the URL.
const source=load(original);
let js=source('script:not([src])').text();
js=js.replace(/\/\* ====== LANGUAGE SWITCHER ====== \*\/[\s\S]*?(?=\/\* ====== PRELOADER)/,`/* Language versions are static HTML documents linked with ordinary anchors. */
    function initLang() {}
    `);
js=js.replaceAll("./images/clients/brand-",'/assets/images/clients/brand-').replace(/(\/assets\/images\/clients\/brand-\d+)\.png/g,'$1.webp');
js=js.replace('alt="${brand.name}" />','alt="${brand.name}" width="400" height="250" decoding="async" loading="lazy" />');
js=js.replace("function closeMenu() {burger.classList", "function closeMenu() {burger.setAttribute('aria-expanded', 'false'); navLinks.inert = window.matchMedia('(max-width:768px)').matches; burger.classList");
js=js.replace("burger.classList.toggle('active');","burger.classList.toggle('active');\n          burger.setAttribute('aria-expanded', String(open));\n          navLinks.inert = !open;");
js=js.replace("overlay.addEventListener('click', closeMenu);",`overlay.addEventListener('click', closeMenu);
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && navLinks.classList.contains('open')) { closeMenu(); burger.focus(); } });
        const mobileMenu = window.matchMedia('(max-width:768px)');
        const syncMenu = () => { closeMenu(); navLinks.inert = mobileMenu.matches; };
        mobileMenu.addEventListener('change', syncMenu); syncMenu();`);
js=js.replace("const id = a.getAttribute('href'); if (id === '#') return;","const id = a.getAttribute('href'); if (id === '#') return;");
js=js.replace("behavior: 'smooth'","behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'");
const messages={
 uz:{required:'Iltimos, barcha majburiy maydonlarni to‘ldiring.',email:'To‘g‘ri elektron pochta manzilini kiriting.',success:'Xabar yuborildi! 24 soat ichida siz bilan bog‘lanamiz.',error:'Xabar yuborilmadi. Qayta urinib ko‘ring yoki Telegram orqali yozing.'},
 ru:{required:'Пожалуйста, заполните все обязательные поля.',email:'Введите корректный адрес электронной почты.',success:'Сообщение отправлено! Мы свяжемся с вами в течение 24 часов.',error:'Не удалось отправить сообщение. Попробуйте ещё раз или напишите в Telegram.'},
 en:{required:'Please fill in all required fields.',email:'Please enter a valid email address.',success:"Message sent! We’ll get back to you within 24 hours.",error:'Unable to send your message. Please try again or contact us on Telegram.'}
};
js=js.replace("function initContactForm() {",`function initContactForm() {\n      const messages = ${JSON.stringify(messages)};\n      const msg = messages[document.documentElement.lang] || messages.en;`);
js=js.replace("showStatus('error', 'Please fill in all required fields.')","showStatus('error', msg.required)")
 .replace("showStatus('error', 'Please enter a valid email address.')","showStatus('error', msg.email)")
 .replace("showStatus('success', 'Message sent! We\\'ll get back to you within 24 hours.')","showStatus('success', msg.success)")
 .replace("showStatus('error', 'Something went wrong. Please try again.')","showStatus('error', msg.error)");
js=js.replace('initLang(); initAOS();',"document.documentElement.classList.add('js-ready'); initLang(); initAOS();");
await fs.writeFile('assets/site.js',js.trim()+'\n');

const pages=[];
async function savePage($,route,lang) {
  const file=route==='/'?'index.html':`${route.slice(1)}index.html`;
  const html='<!DOCTYPE html>\n'+$.html().replace(/^<!DOCTYPE html>\s*/i,'');
  await fs.mkdir(path.dirname(file),{recursive:true}); await fs.writeFile(file,html);
  pages.push({route,lang,file});
}
for(const lang of languages) {
  await savePage(localizedHome(lang),homePaths[lang],lang);
  for(const service of services) await savePage(servicePage(lang,service),service.paths[lang],lang);
}
const sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+pages.map(p=>`  <url><loc>${absolute(p.route)}</loc></url>`).join('\n')+'\n</urlset>\n';
await fs.writeFile('sitemap.xml',sitemap);
await fs.writeFile('robots.txt',`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
await fs.mkdir('dist',{recursive:true});
for(const {file} of pages) {const target=path.join('dist',file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(file,target);}
for(const file of ['style.css','robots.txt','sitemap.xml','site.webmanifest','favicon.ico','apple-touch-icon.png',...[32,48,96,192,512].map(s=>`favicon-${s}.png`)]) await fs.copyFile(file,path.join('dist',file));
await fs.cp('assets','dist/assets',{recursive:true});
await fs.mkdir('dist/images',{recursive:true});await fs.copyFile('images/logo.png','dist/images/logo.png');
await fs.writeFile('dist/404.html',`<!doctype html><html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Sahifa topilmadi — NOMU</title><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/style.css"></head><body><main class="container service-intro"><h1>404 — Sahifa topilmadi</h1><p>Страница не найдена / Page not found</p><p><a class="btn btn-primary" href="/">O‘zbekcha</a> <a class="btn btn-ghost" href="/ru/">Русский</a> <a class="btn btn-ghost" href="/en/">English</a></p></main></body></html>`);
console.log(`Built ${pages.length} static pages for ${origin}; deployment output: dist/`);
