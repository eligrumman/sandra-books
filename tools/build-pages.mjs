#!/usr/bin/env node
// Build the pages search engines read: a home page per language (/, /ru/, /en/) with the
// texts already in the HTML, a page per work per language (works/<id>/), sitemap.xml and
// robots.txt. Everything comes from data.js, catalog.js and images.js.
//
// Usage: node tools/build-pages.mjs   (run after build-catalog.py / build-images.py, or after editing data.js)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.join(ROOT, 'dist');
const SITE_URL = 'https://sandraleifer.com/';
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const write = (p, s) => { fs.mkdirSync(path.dirname(path.join(DIST, p)), {recursive: true}); fs.writeFileSync(path.join(DIST, p), s); };

const ctx = vm.createContext({window: {}});
vm.runInContext(read('dist/assets/js/images.js') + read('dist/assets/js/data.js') + read('dist/assets/js/catalog.js'), ctx);
const {SITE, IMAGES} = ctx.window;

const LANGS = ['he', 'ru', 'en'];
const L = (arr, lang) => arr[LANGS.indexOf(lang)] ?? arr[0];
const dir = lang => lang === 'he' ? 'rtl' : 'ltr';
const prefix = lang => lang === 'he' ? '' : lang + '/';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ltr = s => '\u2066' + s + '\u2069';
const UNDER1000 = 'https://www.under1000.com/he-IL/artists/%D7%A1%D7%A0%D7%93%D7%A8%D7%94-%D7%9C%D7%99%D7%99%D7%A4%D7%A8-9ea352ad';
const SAME_AS = [UNDER1000, 'https://sites.google.com/view/sandra-leifer-art'];

// How Sandra is named and described in each language
const SEO = {
  he: {name: 'סנדרה לייפר', job: 'אמנית ומורה לאמנות', locale: 'he_IL', title: SITE.text.he.title,
    desc: 'סנדרה לייפר, אמנית ומורה לאמנות בישראל: ציורים מקוריים באקריליק ובצבעי מים, נוירוגרפיקה, עולמות נסתרים, בודי־ארט, סדנאות ואגדות מאוירות לילדים. עבודות מקוריות למכירה.',
    works: 'עבודות', allWorks: 'כל העבודות', by: 'מאת', about: 'על היצירה', ask: 'לפרטים ולרכישה', museum: 'לראות בתערוכה', prev: 'היצירה הקודמת', next: 'היצירה הבאה',
    cm: 'ס״מ', home: 'סנדרה לייפר', series: 'סדרה', artwork: 'יצירה', imgAlt: (t, n) => `${t} — ${n}`, original: 'עבודה מקורית'},
  ru: {name: 'Сандра Лейфер', job: 'Художница и педагог', locale: 'ru_RU', title: SITE.text.ru.title,
    desc: 'Сандра Лейфер — художница и педагог из Израиля: оригинальные картины акрилом и акварелью, нейрографика, скрытые миры, боди-арт, мастер-классы и иллюстрированные сказки для детей. Оригиналы в продаже.',
    works: 'Работы', allWorks: 'Все работы', by: 'Автор', about: 'О работе', ask: 'Узнать о покупке', museum: 'Посмотреть на выставке', prev: 'Предыдущая работа', next: 'Следующая работа',
    cm: 'см', home: 'Сандра Лейфер', series: 'Серия', artwork: 'Работа', imgAlt: (t, n) => `${t} — ${n}`, original: 'Оригинал'},
  en: {name: 'Sandra Leifer', job: 'Artist and art teacher', locale: 'en_US', title: SITE.text.en.title,
    desc: 'Sandra Leifer is an artist and art teacher in Israel: original acrylic and watercolour paintings, neurographics, hidden worlds, body art, workshops and illustrated fairy tales for children. Original works for sale.',
    works: 'Works', allWorks: 'All works', by: 'By', about: 'About the work', ask: 'Details and purchase', museum: 'See it in the exhibition', prev: 'Previous work', next: 'Next work',
    cm: 'cm', home: 'Sandra Leifer', series: 'Series', artwork: 'Artwork', imgAlt: (t, n) => `${t} — ${n}`, original: 'Original work'}
};
const NAMES = LANGS.map(l => SEO[l].name);

const works = SITE.works.filter(w => IMAGES.works[w.id]);
const medium = (w, lang) => w.med ? L(w.med, lang) : SITE.text[lang][w.m];
const metaLine = (w, lang) => [medium(w, lang), w.s ? `${ltr(w.s)} ${SEO[lang].cm}` : '', w.y ? ltr(String(w.y)) : ''].filter(Boolean).join(' · ');
const priceOf = w => w.status ? null : (w.price ? Number(w.price.replace(/[^\d]/g, '')) : null);
const largest = (id, max = 1600) => { const s = IMAGES.works[id].s.filter(x => x <= max); return s[s.length - 1]; };
const imgUrl = (id, w) => `assets/img/works/${id}-${w}.webp`;
const homeUrl = lang => SITE_URL + prefix(lang);
const workPath = (id, lang) => `${prefix(lang)}works/${id}/`;

function person(lang) {
  return {'@type': 'Person', '@id': SITE_URL + '#sandra', name: SEO[lang].name, alternateName: NAMES.filter(n => n !== SEO[lang].name),
    jobTitle: SEO[lang].job, url: homeUrl(lang), image: SITE_URL + 'assets/img/portrait-900.webp', sameAs: SAME_AS,
    knowsAbout: lang === 'he' ? ['ציור', 'נוירוגרפיקה', 'צבעי מים', 'בודי־ארט', 'הוראת אמנות'] : lang === 'ru' ? ['Живопись', 'Нейрографика', 'Акварель', 'Боди-арт', 'Преподавание искусства'] : ['Painting', 'Neurographics', 'Watercolour', 'Body art', 'Art teaching'],
    nationality: 'Israel'};
}
function alternates(pathFor) {
  return LANGS.map(l => `<link rel="alternate" hreflang="${l}" href="${SITE_URL}${pathFor(l)}">`).join('\n') +
    `\n<link rel="alternate" hreflang="x-default" href="${SITE_URL}${pathFor('he')}">`;
}
const ld = obj => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

/* ---------- home pages ---------- */
const template = read('src/site/home.html');
function homePage(lang) {
  const T = SITE.text[lang], base = lang === 'he' ? '' : '../', S = SEO[lang];
  let html = template;
  html = html.replace(/<html[^>]*>/, `<html lang="${lang}" dir="${dir(lang)}" data-base="${base}">`);
  // texts in the page's language, already in the HTML
  html = html.replace(/(<([a-z0-9]+)\b[^>]*\sdata-t="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2>)/g, (m, open, tag, key, inner, close) => key in T ? open + T[key] + close : m);
  html = html.replace(/(<[^>]*\sdata-t-label="([^"]+)"[^>]*>)/g, (m, tag, key) => tag.replace(/aria-label="[^"]*"/, `aria-label="${esc(T[key])}"`));
  html = html.replace(/(<[^>]*\sdata-t-alt="([^"]+)"[^>]*>)/g, (m, tag, key) => tag.replace(/alt="[^"]*"/, `alt="${esc(T[key])}"`));
  // language links
  html = html.replace(/<a data-lang-link="(\w+)"/g, (m, l) => `<a data-lang-link="${l}" href="${base}${prefix(l)}"${l === lang ? ' aria-current="page"' : ''}`);
  // every work as a link, in the page's language (the script then lays them out as the gallery)
  const cards = works.map(w => {
    const m = IMAGES.works[w.id], title = L(w.t, lang);
    return `<a class="work" href="works/${w.id}/"><span class="frame" style="--bg:${m.c}"><img src="${base}${imgUrl(w.id, 800)}" width="${m.w}" height="${m.h}" alt="${esc(S.imgAlt(title, S.name))}" loading="lazy" decoding="async"></span><span class="cap"><span><h3>${esc(title)}</h3><p>${esc(metaLine(w, lang))}</p></span></span></a>`;
  }).join('');
  const head = [
    `<title>${esc(S.title)}</title>`,
    `<meta name="description" content="${esc(S.desc)}">`,
    `<link rel="canonical" href="${homeUrl(lang)}">`,
    alternates(l => prefix(l)),
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(S.name)}">`,
    `<meta property="og:locale" content="${S.locale}">`,
    ...LANGS.filter(l => l !== lang).map(l => `<meta property="og:locale:alternate" content="${SEO[l].locale}">`),
    `<meta property="og:title" content="${esc(S.title)}">`,
    `<meta property="og:description" content="${esc(S.desc)}">`,
    `<meta property="og:url" content="${homeUrl(lang)}">`,
    `<meta property="og:image" content="${SITE_URL}assets/img/og.jpg">`,
    `<meta property="og:image:width" content="1200">`, `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${esc(S.name)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    ld({'@context': 'https://schema.org', '@graph': [
      person(lang),
      {'@type': 'WebSite', '@id': SITE_URL + '#site', url: SITE_URL, name: S.name, inLanguage: LANGS, publisher: {'@id': SITE_URL + '#sandra'}},
      {'@type': 'ProfilePage', url: homeUrl(lang), name: S.title, inLanguage: lang, mainEntity: {'@id': SITE_URL + '#sandra'}}
    ]})
  ].join('\n');
  html = html.replace('<!--seo-->', head);
  // relative links from /ru/ and /en/ lead back to the site root
  if (base) html = html.replace(/\b(src|href)="(?!https?:|#|data:|mailto:|\/|\.\.\/)([^"]+)"/g, (m, a, u) => `${a}="${base}${u}"`);
  // links to the works of this language: works/<id>/ next to this page
  return html.replace(/<!--works-->[\s\S]*?(?=<\/div>)/, '<!--works-->' + cards);
}
for (const lang of LANGS) write(prefix(lang) + 'index.html', homePage(lang));

/* ---------- a page per work ---------- */
function workPage(w, i, lang) {
  const S = SEO[lang], T = SITE.text[lang], up = '../'.repeat(lang === 'he' ? 2 : 3);
  const title = L(w.t, lang), m = IMAGES.works[w.id], big = largest(w.id), desc = w.d ? L(w.d, lang) : [];
  const series = SITE.series.find(s => s.id === w.kind)[lang][0];
  const price = priceOf(w), prev = works[(i - 1 + works.length) % works.length], next = works[(i + 1) % works.length];
  const summary = desc.length ? desc.join(' ') : `${title}, ${S.by.toLowerCase()} ${S.name}. ${metaLine(w, lang).replace(/[\u2066\u2069]/g, '')}.`;
  const metaDesc = summary.length > 160 ? summary.slice(0, 157).replace(/\s+\S*$/, '') + '…' : summary;
  const pageTitle = `${title} — ${S.name}`;
  const askHref = w.buy || `${up}${prefix(lang)}#contact`;
  const [cw, ch] = (w.s || '').split('×').map(n => parseFloat(n));
  const art = {'@type': 'VisualArtwork', '@id': SITE_URL + workPath(w.id, lang) + '#work', name: title, url: SITE_URL + workPath(w.id, lang), inLanguage: lang,
    image: SITE_URL + imgUrl(w.id, big), creator: {'@id': SITE_URL + '#sandra'}, artMedium: medium(w, lang), artform: series,
    ...(w.y ? {dateCreated: String(w.y)} : {}), ...(desc.length ? {description: desc.join(' ')} : {}),
    ...(cw && ch ? {width: {'@type': 'QuantitativeValue', value: cw, unitCode: 'CMT'}, height: {'@type': 'QuantitativeValue', value: ch, unitCode: 'CMT'}} : {}),
    ...(price ? {offers: {'@type': 'Offer', price, priceCurrency: 'ILS', availability: 'https://schema.org/InStock', url: w.buy || SITE_URL + workPath(w.id, lang), seller: {'@id': SITE_URL + '#sandra'}}} : {})};
  const crumbs = {'@type': 'BreadcrumbList', itemListElement: [
    {'@type': 'ListItem', position: 1, name: S.name, item: homeUrl(lang)},
    {'@type': 'ListItem', position: 2, name: S.allWorks, item: homeUrl(lang) + '#works'},
    {'@type': 'ListItem', position: 3, name: title, item: SITE_URL + workPath(w.id, lang)}]};
  const srcset = m.s.map(x => `${up}${imgUrl(w.id, x)} ${Math.min(x, m.w)}w`).join(', ');
  return `<!doctype html>
<html lang="${lang}" dir="${dir(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0e0c13">
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(metaDesc)}">
<link rel="canonical" href="${SITE_URL}${workPath(w.id, lang)}">
${alternates(l => workPath(w.id, l))}
<meta property="og:type" content="article">
<meta property="og:site_name" content="${esc(S.name)}">
<meta property="og:locale" content="${S.locale}">
<meta property="og:title" content="${esc(pageTitle)}">
<meta property="og:description" content="${esc(metaDesc)}">
<meta property="og:url" content="${SITE_URL}${workPath(w.id, lang)}">
<meta property="og:image" content="${SITE_URL}${imgUrl(w.id, big)}">
<meta property="og:image:alt" content="${esc(S.imgAlt(title, S.name))}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${up}assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amatic+SC:wght@400;700&family=Fredoka:wght@300;400;500&family=Comfortaa:wght@300;400;500&display=swap">
<link rel="stylesheet" href="${up}assets/css/site.css">
<link rel="stylesheet" href="${up}assets/css/work.css">
${ld({'@context': 'https://schema.org', '@graph': [art, person(lang), crumbs]})}
</head>
<body class="work-page">
<header class="wp-head">
  <a class="wordmark" href="${up}${prefix(lang)}"><span class="wordmark-name">Sandra Leifer</span><span class="wordmark-mark" aria-hidden="true">✳</span></a>
  <nav class="lang" aria-label="שפה / Язык / Language">${LANGS.map(l => `<a href="${up}${workPath(w.id, l)}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="page"' : ''}>${{he: 'עב', ru: 'RU', en: 'EN'}[l]}</a>`).join('')}</nav>
</header>
<main class="wp">
  <nav class="wp-crumbs" aria-label="${esc(S.allWorks)}"><a href="${up}${prefix(lang)}">${esc(S.name)}</a> / <a href="${up}${prefix(lang)}#works">${esc(S.allWorks)}</a> / <span>${esc(series)}</span></nav>
  <div class="wp-grid">
    <figure class="wp-figure" style="--bg:${m.c}"><a href="${up}${imgUrl(w.id, m.s[m.s.length - 1])}"><img src="${up}${imgUrl(w.id, big)}" srcset="${srcset}" sizes="(max-width:900px) 100vw, 60vw" width="${m.w}" height="${m.h}" alt="${esc(S.imgAlt(title, S.name))}" decoding="async" fetchpriority="high"></a></figure>
    <article class="wp-info">
      <p class="wp-kicker">${esc(series)}</p>
      <h1>${esc(title)}</h1>
      <p class="wp-artist">${esc(S.by)} <a href="${up}${prefix(lang)}#about">${esc(S.name)}</a></p>
      <p class="wp-meta">${esc(metaLine(w, lang))}</p>
      ${w.status ? `<p class="wp-price muted">${esc(L(w.status, lang))}</p>` : w.price ? `<p class="wp-price">${esc(w.price)}</p>` : ''}
      ${desc.length ? `<h2>${esc(S.about)}</h2>\n      ${desc.map(p => `<p>${esc(p)}</p>`).join('\n      ')}` : ''}
      <p class="wp-actions">${!w.status && (w.price || w.buy) ? `<a class="wp-ask" href="${esc(askHref)}"${w.buy ? ' target="_blank" rel="noopener"' : ''}>${esc(S.ask)}</a>` : ''}${w.no ? `<a class="wp-museum" href="${up}museum/?lang=${lang}&amp;work=${w.id}">${esc(S.museum)}</a>` : ''}</p>
    </article>
  </div>
  <nav class="wp-next" aria-label="${esc(S.allWorks)}">
    <a href="${up}${workPath(prev.id, lang)}" rel="prev"><small>${esc(S.prev)}</small>${esc(L(prev.t, lang))}</a>
    <a href="${up}${prefix(lang)}#works">${esc(S.allWorks)}</a>
    <a href="${up}${workPath(next.id, lang)}" rel="next"><small>${esc(S.next)}</small>${esc(L(next.t, lang))}</a>
  </nav>
</main>
<footer class="footer"><span>© ${new Date().getFullYear()} Sandra Leifer</span><span>${esc(T.rights)}</span></footer>
</body>
</html>
`;
}
for (const lang of LANGS) {
  const dirOf = path.join(DIST, prefix(lang), 'works');
  if (fs.existsSync(dirOf)) fs.rmSync(dirOf, {recursive: true}); // works that left the site leave no page behind
  works.forEach((w, i) => write(workPath(w.id, lang) + 'index.html', workPage(w, i, lang)));
}

/* ---------- sitemap and robots ---------- */
const today = new Date().toISOString().slice(0, 10);
const entry = (pathFor, priority) => LANGS.map(l => `  <url>\n    <loc>${SITE_URL}${pathFor(l)}</loc>\n` +
  LANGS.map(k => `    <xhtml:link rel="alternate" hreflang="${k}" href="${SITE_URL}${pathFor(k)}"/>`).join('\n') +
  `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${pathFor('he')}"/>\n    <lastmod>${today}</lastmod>\n    <priority>${priority}</priority>\n  </url>`).join('\n');
const single = (p, priority) => `  <url>\n    <loc>${SITE_URL}${p}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${priority}</priority>\n  </url>`;
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entry(prefix, '1.0')}
${works.map(w => entry(l => workPath(w.id, l), '0.8')).join('\n')}
${single('museum/', '0.7')}
${single('book/', '0.6')}
${single('dragon/', '0.6')}
</urlset>
`);
write('robots.txt', `User-agent: *
Allow: /
Disallow: /concepts/

Sitemap: ${SITE_URL}sitemap.xml
`);
console.log(`${LANGS.length} home pages, ${works.length * LANGS.length} work pages, sitemap with ${(works.length + 1) * LANGS.length + 3} addresses`);
