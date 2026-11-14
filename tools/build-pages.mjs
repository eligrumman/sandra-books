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
vm.runInContext(read('dist/assets/js/images.js') + read('dist/assets/js/data.js') + read('dist/assets/js/catalog.js') + read('dist/assets/js/body-art-data.js'), ctx);
const {SITE, IMAGES, BODY_ART} = ctx.window;

const LANGS = ['he', 'ru', 'en'];
const L = (arr, lang) => arr[LANGS.indexOf(lang)] ?? arr[0];
const dir = lang => lang === 'he' ? 'rtl' : 'ltr';
const prefix = lang => lang === 'he' ? '' : lang + '/';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ltr = s => '\u2066' + s + '\u2069';
const SAME_AS = ['https://sites.google.com/view/sandra-leifer-art'];
const PHONE = '+972-53-538-0014';

// How Sandra is named and described in each language
const SEO = {
  he: {name: 'סנדרה לייפר', job: 'אמנית ומורה לאמנות', locale: 'he_IL', title: SITE.text.he.title,
    desc: 'סנדרה לייפר, אמנית מקצועית עם יותר מעשרים שנות ניסיון בהוראת אמנות חזותית וחברה באיגוד אמני אונסק״ו. ציורים מקוריים, נוירוגרפיקה וסדנאות.',
    works: 'עבודות', allWorks: 'כל העבודות', by: 'מאת', about: 'על היצירה', ask: 'לפרטים ולרכישה', museum: 'לראות בתערוכה', prev: 'היצירה הקודמת', next: 'היצירה הבאה',
    cm: 'ס״מ', home: 'סנדרה לייפר', series: 'סדרה', artwork: 'יצירה', imgAlt: (t, n) => `${t} — ${n}`, original: 'עבודה מקורית', onRequest: 'מחיר לפי פנייה'},
  ru: {name: 'Сандра Лейфер', job: 'Художница и педагог', locale: 'ru_RU', title: SITE.text.ru.title,
    desc: 'Сандра Лейфер — профессиональная художница с более чем 20-летним опытом преподавания изобразительного искусства, член Союза художников ЮНЕСКО. Оригинальные картины, НейроГрафика и мастер-классы.',
    works: 'Работы', allWorks: 'Все работы', by: 'Автор', about: 'О работе', ask: 'Узнать о покупке', museum: 'Посмотреть на выставке', prev: 'Предыдущая работа', next: 'Следующая работа',
    cm: 'см', home: 'Сандра Лейфер', series: 'Серия', artwork: 'Работа', imgAlt: (t, n) => `${t} — ${n}`, original: 'Оригинал', onRequest: 'Цена по запросу'},
  en: {name: 'Sandra Leifer', job: 'Artist and art teacher', locale: 'en_US', title: SITE.text.en.title,
    desc: 'Sandra Leifer is a professional artist with more than 20 years of experience teaching visual arts and a member of the UNESCO Artists’ Union. Original paintings, NeuroGraphica and workshops.',
    works: 'Works', allWorks: 'All works', by: 'By', about: 'About the work', ask: 'Details and purchase', museum: 'See it in the exhibition', prev: 'Previous work', next: 'Next work',
    cm: 'cm', home: 'Sandra Leifer', series: 'Series', artwork: 'Artwork', imgAlt: (t, n) => `${t} — ${n}`, original: 'Original work', onRequest: 'Price on request'}
};
const NAMES = LANGS.map(l => SEO[l].name);
// UI labels of the body-art page (no facts about the photos: they have no titles, years or sizes)
const BA = {
  he: {title: 'בודי־ארט ופייס־ארט', art: 'בודי־ארט ופייס־ארט', events: 'תחרויות ואירועים', alt: 'בודי־ארט מאת סנדרה לייפר', altEvents: 'תחרויות ואירועים, סנדרה לייפר',
    photo: (n, t) => `תמונה ${n} מתוך ${t}`, credit: n => `צילום: ${n}`, more: 'עוד בודי־ארט ופייס־ארט', back: 'כל העבודות', close: 'סגירה', prev: 'התמונה הקודמת', next: 'התמונה הבאה', gallery: 'גלריית תמונות'},
  ru: {title: 'Боди-арт и фейс-арт', art: 'Боди-арт и фейс-арт', events: 'Конкурсы и мероприятия', alt: 'Боди-арт, Сандра Лейфер', altEvents: 'Конкурсы и мероприятия, Сандра Лейфер',
    photo: (n, t) => `фото ${n} из ${t}`, credit: n => `Фото: ${n}`, more: 'Ещё боди-арт и фейс-арт', back: 'Все работы', close: 'Закрыть', prev: 'Предыдущее фото', next: 'Следующее фото', gallery: 'Галерея фотографий'},
  en: {title: 'Body art & face art', art: 'Body art & face art', events: 'Contests & events', alt: 'Body art by Sandra Leifer', altEvents: 'Contests and events, Sandra Leifer',
    photo: (n, t) => `photo ${n} of ${t}`, credit: n => `Photo: ${n}`, more: 'More body art & face art', back: 'All works', close: 'Close', prev: 'Previous photo', next: 'Next photo', gallery: 'Photo gallery'}
};

const works = SITE.works.filter(w => IMAGES.works[w.id]);
const medium = (w, lang) => w.med ? L(w.med, lang) : SITE.text[lang][w.m];
const metaLine = (w, lang) => [medium(w, lang), w.s ? `${ltr(w.s)} ${SEO[lang].cm}` : '', w.y ? ltr(String(w.y)) : ''].filter(Boolean).join(' · ');
const priceOf = w => w.status ? null : (w.price ? Number(w.price.replace(/[^\d]/g, '')) : null);
const largest = (id, max = 1600) => { const s = IMAGES.works[id].s.filter(x => x <= max); return s[s.length - 1]; };
const imgUrl = (id, w) => `assets/img/works/${id}-${w}.webp`;
const homeUrl = lang => SITE_URL + prefix(lang);
const workPath = (id, lang) => `${prefix(lang)}works/${id}/`;
const bioPath = lang => `${prefix(lang)}about/`;
const bodyPath = lang => `${prefix(lang)}body-art/`;

const PERSON = {
  he: {desc: SITE.text.he.aboutLead, alumni: ['בית הספר לאמנות מספר 1, ירוסלבל', 'המכללה לאמנות בירוסלבל'], member: ['איגוד האמנים המקצועיים בישראל', 'איגוד אמני אונסק״ו'],
    award: ['פרסים בינלאומיים באיפור יצירתי ובאיפור אמנותי', 'מקום ראשון בתחרויות בינלאומיות בישראל, 2025 ו־2026'], org: 'ילדים אמנים',
    know: ['ציור', 'נוירוגרפיקה', 'צבעי מים', 'בודי־ארט', 'הוראת אמנות חזותית', 'אימון אסתטי', 'עבודה עם הגוף']},
  ru: {desc: SITE.text.ru.aboutLead, alumni: ['Художественная школа № 1, Ярославль', 'Ярославское художественное училище'], member: ['Союз профессиональных художников Израиля', 'Союз художников ЮНЕСКО'],
    award: ['Международные награды в области креативного макияжа и художественного грима', 'Первые места на международных конкурсах в Израиле, 2025 и 2026'], org: 'Дети-художники',
    know: ['Живопись', 'Нейрографика', 'Акварель', 'Боди-арт', 'Преподавание изобразительного искусства', 'Эстетический коучинг', 'Телесные практики']},
  en: {desc: SITE.text.en.aboutLead, alumni: ['Art School No. 1, Yaroslavl', 'Yaroslavl Art College'], member: ['Union of Professional Artists of Israel', 'UNESCO Artists’ Union'],
    award: ['International awards in creative makeup and artistic makeup', 'First prizes at international competitions in Israel, 2025 and 2026'], org: 'Children Artists',
    know: ['Painting', 'NeuroGraphica', 'Watercolor', 'Body art', 'Visual arts education', 'Aesthetic coaching', 'Bodywork']}
};
function person(lang) {
  const X = PERSON[lang];
  return {'@type': 'Person', '@id': SITE_URL + '#sandra', name: SEO[lang].name, alternateName: NAMES.filter(n => n !== SEO[lang].name),
    jobTitle: SEO[lang].job, description: X.desc, url: homeUrl(lang), image: SITE_URL + 'assets/img/portrait-900.webp?v=2', sameAs: SAME_AS, telephone: PHONE,
    contactPoint: {'@type': 'ContactPoint', telephone: PHONE, contactType: 'sales', availableLanguage: ['Hebrew', 'Russian', 'English']},
    alumniOf: X.alumni.map(name => ({'@type': 'EducationalOrganization', name})),
    memberOf: X.member.map(name => ({'@type': 'Organization', name})),
    award: X.award, knowsAbout: X.know,
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
      {'@type': 'Organization', '@id': SITE_URL + '#children-artists', name: PERSON[lang].org, founder: {'@id': SITE_URL + '#sandra'}},
      {'@type': 'ProfilePage', url: homeUrl(lang), name: S.title, inLanguage: lang, mainEntity: {'@id': SITE_URL + '#sandra'}}
    ]})
  ].join('\n');
  html = html.replace('<!--seo-->', head);
  html = html.replace(/href="https:\/\/wa\.me\/[^"]*"(?= target="_blank" rel="noopener" data-wa)/, `href="${esc(SITE.waHello(lang))}"`);
  // relative links from /ru/ and /en/ lead back to the site root
  if (base) html = html.replace(/\b(src|href)="(?!https?:|#|data:|mailto:|tel:|\/|\.\.\/)([^"]+)"/g, (m, a, u) => `${a}="${base}${u}"`);
  // the biography page of this language (about/ next to the home page)
  if (base) html = html.split('href="../about/" data-bio-link').join(`href="../${lang}/about/" data-bio-link`);
  // links to the works of this language: works/<id>/ next to this page
  return html.replace(/<!--works-->[\s\S]*?(?=<\/div>)/, '<!--works-->' + cards);
}
for (const lang of LANGS) write(prefix(lang) + 'index.html', homePage(lang));

/* ---------- a page per work ---------- */
// Meta description of at most 160 characters: whole sentences when they fit, otherwise whole words and an ellipsis
function trimDesc(text, max = 160) {
  text = text.replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const end = Math.max(...['. ', '! ', '? ', '.', '!', '?'].map(p => cut.lastIndexOf(p)));
  if (end >= 70 && /[.!?]/.test(cut[end])) return cut.slice(0, end + 1);
  const word = cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:\-–—(«“"]+$/, '');
  return word + '…';
}
function workPage(w, i, lang) {
  const S = SEO[lang], T = SITE.text[lang], up = '../'.repeat(lang === 'he' ? 2 : 3);
  const title = L(w.t, lang), m = IMAGES.works[w.id], big = largest(w.id), desc = w.d ? L(w.d, lang) : [];
  const series = SITE.series.find(s => s.id === w.kind)[lang][0];
  const price = priceOf(w), prev = works[(i - 1 + works.length) % works.length], next = works[(i + 1) % works.length];
  const summary = desc.length ? desc.join(' ') : `${title}, ${S.by.toLowerCase()} ${S.name}. ${metaLine(w, lang).replace(/[\u2066\u2069]/g, '')}.`;
  const metaDesc = trimDesc(summary);
  const pageTitle = `${title} — ${S.name}`;
  const askHref = SITE.waWork(lang, w, SITE_URL + workPath(w.id, lang)); // a WhatsApp message to Sandra about this work
  const [cw, ch] = (w.s || '').split('×').map(n => parseFloat(n));
  const art = {'@type': 'VisualArtwork', '@id': SITE_URL + workPath(w.id, lang) + '#work', name: title, url: SITE_URL + workPath(w.id, lang), inLanguage: lang,
    image: SITE_URL + imgUrl(w.id, big), creator: {'@id': SITE_URL + '#sandra'}, artMedium: medium(w, lang), artform: series,
    ...(w.y ? {dateCreated: String(w.y)} : {}), ...(desc.length ? {description: desc.join(' ')} : {}),
    ...(cw && ch ? {width: {'@type': 'QuantitativeValue', value: cw, unitCode: 'CMT'}, height: {'@type': 'QuantitativeValue', value: ch, unitCode: 'CMT'}} : {}),
    ...(price ? {offers: {'@type': 'Offer', price, priceCurrency: 'ILS', availability: 'https://schema.org/InStock', url: SITE_URL + workPath(w.id, lang), seller: {'@id': SITE_URL + '#sandra'}}} : {})};
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
<script src="${up}assets/js/analytics.js" defer></script>
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
      ${w.status ? `<p class="wp-price muted">${esc(L(w.status, lang))}</p>` : w.price ? `<p class="wp-price">${esc(w.price)}</p>` : `<p class="wp-price muted">${esc(S.onRequest)}</p>`}
      ${desc.length ? `<h2>${esc(S.about)}</h2>\n      ${desc.map(p => `<p>${esc(p)}</p>`).join('\n      ')}` : ''}${w.kind === 'body' ? `
      <p class="wp-more"><a href="${up}${bodyPath(lang)}" data-body-art-link>${esc(BA[lang].more)} →</a></p>` : ''}
      <p class="wp-actions">${!w.status ? `<a class="wp-ask" href="${esc(askHref)}" target="_blank" rel="noopener">${esc(S.ask)}</a>` : ''}${w.no ? `<a class="wp-museum" href="${up}museum/?lang=${lang}&amp;work=${w.id}">${esc(S.museum)}</a>` : ''}</p>
    </article>
  </div>
  <nav class="wp-next" aria-label="${esc(S.allWorks)}">
    <a href="${up}${workPath(prev.id, lang)}" rel="prev"><small>${esc(S.prev)}</small>${esc(L(prev.t, lang))}</a>
    <a href="${up}${prefix(lang)}#works">${esc(S.allWorks)}</a>
    <a href="${up}${workPath(next.id, lang)}" rel="next"><small>${esc(S.next)}</small>${esc(L(next.t, lang))}</a>
  </nav>
</main>
<footer class="footer"><span>© ${new Date().getFullYear()} Sandra Leifer</span><span>${esc(T.rights)}</span><span class="foot-titles">${esc(T.footTitles)}</span><a href="${up}${bioPath(lang)}" data-bio-link>${esc(T.navAbout)}</a></footer>
<script>
// Every WhatsApp ask fires 'sl:wa' on document; assets/js/analytics.js sends it to PostHog as whatsapp_click.
document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('.wp-ask'); if (a) document.dispatchEvent(new CustomEvent('sl:wa', {detail: {type: 'work', slug: ${JSON.stringify(w.id)}}})); });
</script>
</body>
</html>
`;
}
for (const lang of LANGS) {
  const dirOf = path.join(DIST, prefix(lang), 'works');
  if (fs.existsSync(dirOf)) fs.rmSync(dirOf, {recursive: true}); // works that left the site leave no page behind
  works.forEach((w, i) => write(workPath(w.id, lang) + 'index.html', workPage(w, i, lang)));
}


/* ---------- biography page per language (/about/, /ru/about/, /en/about/) ---------- */
// The text is src/site/bio.md, verbatim: three sections (HE, EN, RU). Per section: name (h1), a **roles** line,
// "# " headings (h2), paragraphs, "- " bullets (ul), a closing *quote* and the signature line.
const bioSrc = read('src/site/bio.md').split(/^={10,} .*$/m).slice(1);
const BIO_ORDER = ['he', 'en', 'ru'];
const BIO_LABEL = {he: 'אודות', ru: 'О художнице', en: 'About'};
function bioPage(lang) {
  const S = SEO[lang], T = SITE.text[lang];
  const lines = bioSrc[BIO_ORDER.indexOf(lang)].split('\n').map(l => l.trim()).filter(Boolean);
  const name = lines.shift(), roles = lines.shift().replace(/^\*\*|\*\*$/g, '');
  const signature = lines.pop(), quote = lines.pop().replace(/^\*|\*$/g, '');
  const up = '../'.repeat(lang === 'he' ? 1 : 2);
  let body = '', list = false, h2n = 0;
  const ALT = {he: ['סנדרה לייפר', 'סנדרה לייפר מנחה סדנת אמנות סביב שולחן עבודה'], en: ['Sandra Leifer', 'Sandra Leifer leading an art workshop at a work table'], ru: ['Сандра Лейфер', 'Сандра Лейфер ведёт арт-мастерскую у рабочего стола']}[lang];
  for (const l of lines) {
    const li = l.startsWith('- ');
    if (list && !li) { body += '</ul>\n'; list = false; }
    if (li) { if (!list) { body += '<ul class="bio-list">\n'; list = true; } body += `<li>${esc(l.slice(2))}</li>\n`; }
    else if (l.startsWith('# ')) {
      if (++h2n === 3) body += `<figure class="bio-photo"><img src="${up}assets/img/studio/ws-4.webp" width="1400" height="933" alt="${esc(ALT[1])}" loading="lazy" decoding="async"></figure>\n`;
      body += `<h2>${esc(l.slice(2))}</h2>\n`;
    }
    else body += `<p>${esc(l)}</p>\n`;
  }
  if (list) body += '</ul>\n';
  const first = lines.find(l => !l.startsWith('#') && !l.startsWith('- ')), desc = first.match(/^.*?[.!?](?=\s|$)/)[0];
  const title = `${S.name} · ${BIO_LABEL[lang]}`, url = SITE_URL + bioPath(lang);
  return `<!doctype html>
<html lang="${lang}" dir="${dir(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0e0c13">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
${alternates(bioPath)}
<meta property="og:type" content="profile">
<meta property="og:site_name" content="${esc(S.name)}">
<meta property="og:locale" content="${S.locale}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE_URL}assets/img/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${up}assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amatic+SC:wght@400;700&family=Fredoka:wght@300;400;500&family=Comfortaa:wght@300;400;500&display=swap">
<link rel="stylesheet" href="${up}assets/css/site.css">
<link rel="stylesheet" href="${up}assets/css/bio.css">
<script src="${up}assets/js/analytics.js" defer></script>
${ld({'@context': 'https://schema.org', '@graph': [person(lang), {'@type': 'ProfilePage', '@id': url + '#profile', url, name: title, inLanguage: lang, mainEntity: {'@id': SITE_URL + '#sandra'}}]})}
</head>
<body class="bio-page">
<header class="bio-head">
  <a class="wordmark" href="${up}${prefix(lang)}" aria-label="Sandra Leifer"><span class="wordmark-name">Sandra Leifer</span><span class="wordmark-mark" aria-hidden="true">✳</span></a>
  <div class="bio-tools">
    <nav class="lang" aria-label="שפה / Язык / Language">${LANGS.map(l => `<a href="${up}${bioPath(l)}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="page"' : ''}>${{he: 'עב', ru: 'RU', en: 'EN'}[l]}</a>`).join('')}</nav>
  </div>
</header>
<main class="bio" id="bio">
<div class="bio-intro">
<img class="bio-portrait" src="${up}assets/img/portrait-900.webp?v=2" width="580" height="725" alt="${esc(ALT[0])}" decoding="async">
<div class="bio-intro-text">
<h1>${esc(name)}</h1>
<p class="bio-roles">${esc(roles)}</p>
</div>
</div>
${body}<figure class="bio-quote"><blockquote><p><em>${esc(quote)}</em></p></blockquote><figcaption>${esc(signature)}</figcaption></figure>
</main>
<footer class="footer"><span>© 2026 Sandra Leifer</span><span>${esc(T.rights)}</span><span class="foot-titles">${esc(T.footTitles)}</span><a href="${up}${prefix(lang)}">${esc(S.name)}</a></footer>
<script>try{localStorage.setItem('sl-lang','${lang}')}catch(e){}</script>
</body>
</html>
`;
}
for (const lang of LANGS) write(bioPath(lang) + 'index.html', bioPage(lang));

/* ---------- body-art gallery page per language (/body-art/, /ru/body-art/, /en/body-art/) ---------- */
// Photos from BODY_ART (body-art-data.js). Two groups: studio/face-art photos and contest/event photos. Items tagged
// review:'nudity' carry data-review="nudity" and drop out when BODY_ART.hideReview lists their tag.
const bodyItems = BODY_ART.items.filter(i => !BODY_ART.hideReview.includes(i.review));
const bioSections = read('src/site/bio.md').split(/^={10,} .*$/m).slice(1);
// the bio's own sentence about the first places in contests, verbatim, per language
const contestSentence = lang => bioSections[BIO_ORDER.indexOf(lang)].split('\n').map(l => l.trim()).find(l => /2025/.test(l) && !l.startsWith('#'));
function bodyPage(lang) {
  const S = SEO[lang], T = SITE.text[lang], B = BA[lang], up = '../'.repeat(lang === 'he' ? 1 : 2);
  const url = SITE_URL + bodyPath(lang);
  const groups = [['art', B.art, B.alt, null], ['events', B.events, B.altEvents, contestSentence(lang)]];
  let n = 0, sections = '';
  const ld_imgs = [];
  for (const [g, heading, alt, intro] of groups) {
    const items = bodyItems.filter(i => i.group === g);
    if (!items.length) continue;
    const figs = items.map((i, k) => {
      const label = `${alt}, ${B.photo(k + 1, items.length)}`;
      ld_imgs.push({'@type': 'ImageObject', contentUrl: `${SITE_URL}assets/img/body-art/${i.id}-1600.webp`, name: label, creator: {'@id': SITE_URL + '#sandra'}});
      return `<figure class="ba-item"${i.review ? ` data-review="${i.review}"` : ''}><a href="${up}assets/img/body-art/${i.id}-1600.webp" data-w="${i.w}" data-h="${i.h}"><img src="${up}assets/img/body-art/${i.id}-800.webp" srcset="${up}assets/img/body-art/${i.id}-800.webp ${i.w8}w, ${up}assets/img/body-art/${i.id}-1600.webp ${i.w}w" sizes="(max-width:700px) 50vw, (max-width:1100px) 33vw, 25vw" width="${i.w8}" height="${i.h8}" alt="${esc(label)}" loading="lazy" decoding="async"></a>${i.credit ? `<figcaption class="ba-credit">${esc(B.credit(i.credit))}</figcaption>` : ''}</figure>`;
    }).join('\n');
    sections += `<section class="ba-group" id="${g}" aria-labelledby="h-${g}">\n<h2 id="h-${g}">${esc(heading)}</h2>\n${intro ? `<p class="ba-intro">${esc(intro)}</p>\n` : ''}<div class="ba-grid">\n${figs}\n</div>\n</section>\n`;
  }
  const desc = `${B.title}, ${S.name}.`;
  const title = `${B.title} · ${S.name}`;
  return `<!doctype html>
<html lang="${lang}" dir="${dir(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0e0c13">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)} ${esc(SITE.series.find(s => s.id === 'body')[lang][1])}">
<link rel="canonical" href="${url}">
${alternates(bodyPath)}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(S.name)}">
<meta property="og:locale" content="${S.locale}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE_URL}assets/img/body-art/${bodyItems.find(i => i.group === 'art').id}-1600.webp">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${up}assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amatic+SC:wght@400;700&family=Fredoka:wght@300;400;500&family=Comfortaa:wght@300;400;500&display=swap">
<link rel="stylesheet" href="${up}assets/css/site.css">
<link rel="stylesheet" href="${up}assets/css/body-art.css">
<script src="${up}assets/js/analytics.js" defer></script>
<script src="${up}assets/js/body-art.js" defer></script>
${ld({'@context': 'https://schema.org', '@graph': [person(lang), {'@type': 'ImageGallery', '@id': url + '#gallery', url, name: title, inLanguage: lang, creator: {'@id': SITE_URL + '#sandra'}, image: ld_imgs}]})}
</head>
<body class="ba-page">
<header class="ba-head">
  <a class="wordmark" href="${up}${prefix(lang)}" aria-label="Sandra Leifer"><span class="wordmark-name">Sandra Leifer</span><span class="wordmark-mark" aria-hidden="true">✳</span></a>
  <nav class="lang" aria-label="שפה / Язык / Language">${LANGS.map(l => `<a href="${up}${bodyPath(l)}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="page"' : ''}>${{he: 'עב', ru: 'RU', en: 'EN'}[l]}</a>`).join('')}</nav>
</header>
<main class="ba" id="main">
<nav class="ba-crumbs" aria-label="${esc(S.allWorks)}"><a href="${up}${prefix(lang)}">${esc(S.name)}</a> / <a href="${up}${prefix(lang)}#works">${esc(B.back)}</a></nav>
<h1>${esc(B.title)}</h1>
${sections}</main>
<footer class="footer"><span>© ${new Date().getFullYear()} Sandra Leifer</span><span>${esc(T.rights)}</span><span class="foot-titles">${esc(T.footTitles)}</span><a href="${up}${bioPath(lang)}" data-bio-link>${esc(T.navAbout)}</a><a href="${up}${prefix(lang)}">${esc(S.name)}</a></footer>
<dialog class="ba-lb" id="baLb" aria-label="${esc(B.gallery)}">
  <div class="ba-lb-top"><span id="baLbCount"></span><button type="button" class="ba-lb-btn" id="baLbClose" aria-label="${esc(B.close)}">✕</button></div>
  <div class="ba-lb-stage">
    <button type="button" class="ba-lb-btn ba-lb-nav" id="baLbPrev" aria-label="${esc(B.prev)}"><span aria-hidden="true">‹</span></button>
    <img id="baLbImg" alt="" draggable="false">
    <button type="button" class="ba-lb-btn ba-lb-nav" id="baLbNext" aria-label="${esc(B.next)}"><span aria-hidden="true">›</span></button>
  </div>
  <div class="ba-lb-cap" id="baLbCap"></div>
</dialog>
<script>try{localStorage.setItem('sl-lang','${lang}')}catch(e){}</script>
</body>
</html>
`;
}
for (const lang of LANGS) write(bodyPath(lang) + 'index.html', bodyPage(lang));

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
${entry(bioPath, '0.7')}
${entry(bodyPath, '0.7')}
${single('museum/', '0.7')}
${single('neurographics/', '0.7')}
${single('book/', '0.6')}
</urlset>
`);
write('robots.txt', `User-agent: *
Allow: /
Disallow: /concepts/

Sitemap: ${SITE_URL}sitemap.xml
`);
console.log(`${LANGS.length} home pages, ${works.length * LANGS.length} work pages, sitemap with ${(works.length + 3) * LANGS.length + 3} addresses`);
