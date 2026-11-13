# NOMU: uch tilli sayt va SEO

Asosiy domen: **https://nomu.uz**. Barcha sahifalar oldindan tayyorlangan HTML; qidiruv robotlari va JavaScriptsiz brauzerlar matn hamda havolalarni o‘qiy oladi.

## Sahifalar

| Til | Bosh sahifa | Xizmatlar katalogi |
| --- | --- | --- |
| O‘zbekcha | `/` | `/xizmatlar/…/` |
| Ruscha | `/ru/` | `/ru/uslugi/…/` |
| Inglizcha | `/en/` | `/en/services/…/` |

Har bir tilda 4 xizmat sahifasi mavjud: marketing/SMM/target reklama, AI marketing, brending/logo va veb-sayt/Telegram bot. Jami **15 indekslanadigan sahifa**.

Har bir sahifada o‘z tilidagi title, description, bitta H1, self-canonical, o‘zaro `hreflang="uz|ru|en"` va `x-default`, Open Graph va Twitter metama’lumotlari bor. `x-default` mos o‘zbekcha sahifaga yo‘naltirilgan. Til tanlash oddiy havolalar orqali ishlaydi; cookie yoki brauzer tiliga qarab avtomatik redirect yo‘q.

JSON-LD: Organization, WebSite, WebPage; xizmatlarda Service va BreadcrumbList. Manzil, reyting, mukofot, narx yoki tasdiqlanmagan natijalar qo‘shilmagan. FAQ matni o‘quvchi uchun mavjud; FAQ rich result kafolati berilmaydi. `meta keywords` va yashirin kalit so‘zlar ishlatilmagan.

## Tahrirlash va tekshirish

```powershell
npm ci
npm run build
npm run check
python -m http.server 8765 --bind 127.0.0.1 --directory dist
```

- `src/home.html` — bosh sahifaning umumiy shabloni va eski o‘zaro ishlash mantiqi.
- `src/content.mjs` — SEO matnlari, tarjimalar, xizmat sahifalari va manzillari.
- `style.css` — umumiy dizayn va xizmat sahifalari uslubi.
- `scripts/assets.mjs` — mavjud logotipdan favicon eksporti va rasmlarning WebP nusxalari. Asl rasmlar saqlanadi.
- `scripts/build.mjs` — HTML, umumiy JavaScript, robots.txt va sitemap.xml yaratadi.
- `scripts/check.mjs` — 15 sahifadagi til, metadata, canonical, hreflang, schema, ichki havolalar, rasmlar va forma label bog‘lanishlarini tekshiradi.
- `dist/` — **serverga chiqariladigan tayyor sayt**. `src/`, `scripts/` va `node_modules/` ommaga chiqarilmaydi.

Rootdagi `index.html`, `ru/`, `en/` va xizmat kataloglari ham generatsiya qilinadi. Ularni qo‘lda tahrirlash o‘rniga shablon yoki content faylini tahrirlang va build qiling. Sahifalar statik; aloqa formasi Vercel server funksiyasidan foydalanadi.

## Vercel sozlamalari

Mavjud `nomu.uz` domeni Vercelda xizmat ko‘rsatmoqda. `vercel.json` build komandasi, `dist` output katalogi, trailing slash, `www.nomu.uz` → `nomu.uz` va `index.html` → toza URL redirectlarini belgilaydi. Noma’lum URLlar bosh sahifaga rewrite qilinmaydi; haqiqiy 404 saqlanishi kerak.

Build qilingan saytni **mavjud NOMU loyihasiga** chiqaring. Domenni yangi loyihaga ko‘chirish shart emas. Boshqa hostingda `dist/` ichidagilarni domenning web-root katalogiga joylashtiring va xuddi shu HTTPS, yagona hostname hamda directory-index tartibini sozlang. Barcha tillarni `/` ga yo‘naltiradigan SPA fallback ishlatmang.

## Saytga chiqarilgandan keyingi ishlar

1. `/`, `/ru/`, `/en/`, xizmat sahifalari, `/favicon.ico`, `/robots.txt` va `/sitemap.xml` HTTP 200 qaytarishini tekshiring. Mavjud bo‘lmagan URL HTTP 404 bo‘lishi kerak.
2. [Google Search Console](https://search.google.com/search-console) orqali `nomu.uz` uchun Domain property oching yoki mavjudini tanlang. Zarur DNS TXT qiymatini Search Console beradi; tasdiqlash kodini taxminan yozmang.
3. Sitemap sifatida `https://nomu.uz/sitemap.xml` ni yuboring. Uch bosh sahifa va xizmat sahifalarini URL Inspection orqali tekshiring, kerak bo‘lsa indekslash so‘rovini bering.
4. [Bing Webmaster Tools](https://www.bing.com/webmasters/) va [Yandex Webmaster](https://webmaster.yandex.com/) da domen egaligini tasdiqlab, shu sitemapni qo‘shish mumkin. Tasdiqlash uchun hisob egasining kirishi kerak.
5. Search Console’da indekslash, Google tanlagan canonical, qidiruv so‘rovlari, bosishlar va Core Web Vitals ko‘rsatkichlarini kuzating. Favicon va snippet yangilanishi qayta crawl bo‘lishini talab qiladi.
6. Keyingi kontent uchun haqiqiy keyslar tayyorlang: vazifa, bajarilgan ish, davr va tekshiriladigan natijalar. Mijoz nomi yoki raqamlarini tasdiqsiz e’lon qilmang. Ishlamaydigan sun’iy sharhlar va kalit so‘zlarni takrorlash o‘rniga foydali xizmat kontentini rivojlantiring.

Sitemap yuborilishi indekslanish yoki birinchi o‘rinni kafolatlamaydi. Umumiy “marketing” so‘zi bilan birga aniq xizmat so‘rovlari va uch til bo‘yicha natijalarni kuzating. Texnik SEO, kontent sifati, raqobat va tashqi obro‘ birgalikda ta’sir qiladi.

## Mavjud aloqa integratsiyasi

Kontakt formasi `/api/contact` orqali ishlaydi. `api/contact.js` server funksiyasi `TELEGRAM_BOT_TOKEN` va `TELEGRAM_CHAT_ID` qiymatlarini Vercel environment variables orqali oladi; ular brauzer kodiga kiritilmaydi. `.env.local` Gitga yuborilmaydi. Boshqa hostingga ko‘chirganda shu endpoint ham sozlanishi kerak.

Endpoint metod, origin, JSON turi, maydonlar va uzunliklarni tekshiradi; Telegramga plain text yuboradi va ichki xatolarni foydalanuvchiga ochmaydi. Avtomatik testlar Telegramni mock qiladi, real xabar yubormaydi. Oldingi ochiq token Git tarixida qolishi mumkin: BotFather orqali uni yangilang, keyin Vercelda `TELEGRAM_BOT_TOKEN` qiymatini almashtirib qayta deploy qiling.

## Rasmiy manbalar

- [Google: ko‘p tilli saytlar](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)
- [Google: hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google: favicon](https://developers.google.com/search/docs/appearance/favicon-in-search)
- [Google: Organization schema](https://developers.google.com/search/docs/appearance/structured-data/organization)
- [Google: sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: SEO boshlang‘ich qo‘llanmasi](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
