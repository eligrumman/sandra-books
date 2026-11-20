// Texts of the yoga landing page (/ru/yoga/, /yoga/, /en/yoga/), read by tools/build-pages.mjs.
// Russian is the main language (x-default), Hebrew the second, English the third.
// Requested by the Owner 2026-11-20: "an NG-like landing page for yoga: she has experience in several types of yoga and can teach yoga classes".
//
// DRAFT PENDING SANDRA: every string in this file is new (2026-11-20) and must be approved by Sandra before it goes to main.
//
// FACTS WE HAVE (the only claims about Sandra on the page):
//   1. She has experience in several types of yoga and can teach yoga classes.  Source: Owner, chat, 2026-11-20.
//   2. Her site biography lists yoga therapy among her fields (he "מטפלת ביוגה" / "יוגה טיפולית", ru "Йога-терапевт" / "йога-терапии",
//      en "Yoga Therapist" / "yoga therapy").  Source: src/site/bio.md lines 5, 51, 83, 129, 161, 207 (published on /about/).
//   3. Artist and visual-arts teacher with more than 20 years of experience; lives and works in Israel; her own method of group creative
//      self-exploration combines movement, breathing, gesture, improvisation and NeuroGraphica.  Source: src/site/bio.md and the NeuroGraphica landing.
//   No other yoga fact was found: searched the repo (src, dist, data.js, README), ~/agents/sandra-site-log.md and the Google Drive
//   (search "yoga", "יוגה", "йога": only unrelated files such as a podcast and a theatre list).
//
// UNKNOWN, NOT ON THE PAGE (placeholders; ask Sandra, then add to the page as facts):
//   - YOGA STYLES she teaches (e.g. hatha, vinyasa, yin ...): the page only has a general overview of styles, marked as "not a list of what Sandra teaches".
//   - CERTIFICATE / training: school, year, hours, teacher-training level.
//   - YEARS of yoga practice / teaching.
//   - FORMAT: online / studio / private / group / corporate.
//   - CITY and place of the classes.
//   - PRICE, schedule, class length, group size, languages of the class, level (beginners?).
//   - TESTIMONIALS (none; the page has no review or rating markup).
// No Course, Offer or Review schema: there is no data for them.
export const YOGA = {
  ru: {
    title: 'Йога с Сандрой Лейфер: занятия и практика | Сандра Лейфер',
    desc: 'Йога с Сандрой Лейфер: у неё есть опыт в нескольких видах йоги, она проводит занятия по йоге. О практике, стилях йоги и записи в WhatsApp.',
    ogAlt: 'Йога с Сандрой Лейфер',
    crumb: 'Йога',
    nav: {what: 'О йоге', styles: 'Стили', about: 'О Сандре', faq: 'Вопросы', neuro: 'Нейрографика'},
    h1: 'Йога', h1Sub: 'с Сандрой Лейфер: практика и занятия',
    lead: 'Йога — это практика, которая соединяет движение, дыхание и внимание к телу. У Сандры Лейфер есть опыт в нескольких видах йоги, и она проводит занятия по йоге. Здесь коротко о практике и о том, как с ней связаться.',
    by: 'Сандра Лейфер — художница и преподаватель изобразительного искусства. В её биографии на сайте среди направлений названа и йога-терапия.',
    ctaBook: 'Написать Сандре в WhatsApp',
    ctaNeuro: 'Нейрографика с Сандрой',
    heroCap: 'Из работ Сандры: «{title}»',
    whatH: 'Что такое йога',
    what: [
      'Йога — древняя практика родом из Индии. В современных занятиях её чаще всего представляют как сочетание поз (асан), дыхания и расслабления, а иногда и медитации.',
      'Разные стили по-разному расставляют акценты: где-то больше плавного движения, где-то долгие удержания поз, где-то спокойное восстановление. Поэтому важно подобрать практику под себя.',
      'Йога — это практика, а не медицинская процедура. При проблемах со здоровьем, травмах или беременности перед занятиями стоит посоветоваться с врачом.'
    ],
    stylesH: 'Какие бывают стили йоги',
    stylesNote: 'Это общий обзор стилей йоги, а не список того, что преподаёт Сандра. Какие именно направления и в каком формате она ведёт, уточняйте у неё лично в WhatsApp.',
    styles: [
      ['Хатха-йога', 'Общее название практик с позами и дыханием. Обычно спокойный темп и внимание к тому, как выполняется каждая поза.'],
      ['Виньяса-йога', 'Позы соединены в плавную последовательность, а движение связано с дыханием.'],
      ['Инь-йога', 'Медленная практика: пассивные позы удерживают долго, на расслаблении.'],
      ['Восстановительная йога', 'Мягкая практика с опорами (подушки, болстеры, одеяла) и акцентом на отдыхе.'],
      ['Йога-терапия', 'Йога, подобранная под потребности конкретного человека. Не заменяет медицинскую помощь.']
    ],
    expectH: 'Как обычно проходит занятие йогой',
    expect: [
      'Обычно занятие включает разогрев, позы, дыхательные упражнения и финальное расслабление. Нужны коврик и удобная одежда.',
      'Формат занятий с Сандрой, место, язык и время обсуждаются лично: напишите ей в WhatsApp.'
    ],
    artH: 'Йога и творчество',
    art: 'Сандра развивает собственный метод группового творческого самоисследования, в котором соединяются движение, дыхание, жест, художественная импровизация и НейроГрафика. Если вам близок этот сплав телесной практики и рисования, посмотрите страницу о нейрографике.',
    artLink: 'Нейрографика: что это и как учиться с Сандрой',
    aboutH: 'Кто ведёт: Сандра Лейфер',
    facts: [
      'Есть опыт в нескольких видах йоги, проводит занятия по йоге.',
      'В биографии на сайте среди направлений названа йога-терапия.',
      'Художница и преподаватель изобразительного искусства с опытом более 20 лет.',
      'Живёт и работает в Израиле.'
    ],
    bio: 'Полная биография',
    portraitAlt: 'Сандра Лейфер',
    classH: 'Занятия йогой с Сандрой',
    class: 'Сандра проводит занятия по йоге. Стиль, формат, место, язык и время занятий обсуждаются лично: напишите ей в WhatsApp.',
    wa: 'Здравствуйте, Сандра! Я прочитал(а) о йоге на вашем сайте и хотел(а) бы узнать о занятиях.',
    faqH: 'Частые вопросы о йоге с Сандрой',
    faq: [
      ['Что такое йога?', 'Йога — древняя практика родом из Индии. В современных занятиях она сочетает позы, дыхание и расслабление, а иногда и медитацию.'],
      ['Проводит ли Сандра Лейфер занятия по йоге?', 'Да. У Сандры есть опыт в нескольких видах йоги, и она проводит занятия по йоге. Подробности обсуждаются лично в WhatsApp: +972 53-538-0014.'],
      ['Какие стили йоги преподаёт Сандра?', 'У неё есть опыт в нескольких видах йоги. Какие именно направления и в каком формате она ведёт занятия, уточняйте у неё в WhatsApp.'],
      ['Как записаться на занятие йогой?', 'Напишите Сандре в WhatsApp: +972 53-538-0014. Формат, место, язык и время занятий обсуждаются лично.'],
      ['Йога — это терапия?', 'Йога — практика движения, дыхания и внимания. Она не заменяет медицинскую или психологическую помощь, а при проблемах со здоровьем сначала стоит посоветоваться с врачом.'],
      ['Можно ли сочетать йогу и творчество?', 'Сандра — художница, и её собственный метод соединяет движение, дыхание, жест, импровизацию и НейроГрафику. Подробнее на странице о нейрографике.']
    ],
    endH: 'Хотите узнать о занятиях йогой?',
    end: 'Напишите Сандре в WhatsApp и расскажите, что вам интересно.',
    phone: 'Телефон и WhatsApp:',
    home: 'Сандра Лейфер',
    homeLink: 'Йога с Сандрой'
  },
  he: {
    title: 'יוגה עם סנדרה לייפר: שיעורים ותרגול | סנדרה לייפר',
    desc: 'יוגה עם סנדרה לייפר: יש לה ניסיון בכמה סוגי יוגה והיא מעבירה שיעורי יוגה. על התרגול, על סגנונות היוגה ועל יצירת קשר בוואטסאפ.',
    ogAlt: 'יוגה עם סנדרה לייפר',
    crumb: 'יוגה',
    nav: {what: 'על יוגה', styles: 'סגנונות', about: 'סנדרה', faq: 'שאלות', neuro: 'נוירוגרפיקה'},
    h1: 'יוגה', h1Sub: 'עם סנדרה לייפר: תרגול ושיעורים',
    lead: 'יוגה היא תרגול שמחבר בין תנועה, נשימה ותשומת לב לגוף. לסנדרה לייפר יש ניסיון בכמה סוגי יוגה, והיא מעבירה שיעורי יוגה. כאן בקצרה על התרגול ועל איך ליצור איתה קשר.',
    by: 'סנדרה לייפר היא אמנית ומורה לאמנות חזותית. בביוגרפיה שלה באתר מופיעה בין התחומים גם יוגה טיפולית.',
    ctaBook: 'לכתוב לסנדרה בוואטסאפ',
    ctaNeuro: 'נוירוגרפיקה עם סנדרה',
    heroCap: 'מהעבודות של סנדרה: ״{title}״',
    whatH: 'מה זו יוגה',
    what: [
      'יוגה היא תרגול עתיק שמקורו בהודו. בשיעורים בימינו מציגים אותה בדרך כלל כשילוב של תנוחות (אסאנות), נשימה והרפיה, ולפעמים גם מדיטציה.',
      'סגנונות שונים שמים דגש במקומות שונים: אחד יותר תנועה זורמת, אחר החזקה ארוכה של תנוחות, ואחר התאוששות רגועה. לכן חשוב לבחור תרגול שמתאים לכם.',
      'יוגה היא תרגול ולא טיפול רפואי. אם יש בעיות בריאותיות, פציעות או הריון, כדאי להתייעץ עם רופא לפני שמתחילים.'
    ],
    stylesH: 'סגנונות יוגה נפוצים',
    stylesNote: 'זו סקירה כללית של סגנונות יוגה ולא רשימה של מה שסנדרה מלמדת. באילו כיוונים ובאיזה פורמט היא מעבירה שיעורים, כדאי לברר איתה אישית בוואטסאפ.',
    styles: [
      ['האטה יוגה', 'שם כללי לתרגול של תנוחות ונשימה. בדרך כלל בקצב רגוע ובתשומת לב לאופן ביצוע כל תנוחה.'],
      ['ויניאסה יוגה', 'התנוחות מחוברות לרצף זורם, והתנועה מסונכרנת עם הנשימה.'],
      ['יין יוגה', 'תרגול איטי: תנוחות פסיביות מוחזקות זמן ארוך, מתוך הרפיה.'],
      ['יוגה משקמת', 'תרגול עדין עם תמיכות (כריות, בולסטרים, שמיכות) ודגש על מנוחה.'],
      ['יוגה טיפולית', 'יוגה שמותאמת לצרכים של אדם מסוים. אינה מחליפה טיפול רפואי.']
    ],
    expectH: 'איך נראה בדרך כלל שיעור יוגה',
    expect: [
      'בדרך כלל השיעור כולל חימום, תנוחות, תרגילי נשימה והרפיה בסוף. צריך מזרן ובגדים נוחים.',
      'את הפורמט של השיעורים עם סנדרה, המקום, השפה והזמן מתאמים אישית: כתבו לה בוואטסאפ.'
    ],
    artH: 'יוגה ויצירה',
    art: 'סנדרה מפתחת שיטה משלה לחקירה עצמית יצירתית בקבוצה, המשלבת תנועת גוף, נשימה, מחווה, אלתור אמנותי ונוירוגרפיקה. אם המפגש הזה בין תרגול גוף וציור קרוב אליכם, כדאי להציץ בעמוד על נוירוגרפיקה.',
    artLink: 'נוירוגרפיקה: מה זה ואיך לומדים עם סנדרה',
    aboutH: 'מי מנחה: סנדרה לייפר',
    facts: [
      'יש לה ניסיון בכמה סוגי יוגה, והיא מעבירה שיעורי יוגה.',
      'בביוגרפיה שלה באתר מופיעה בין התחומים יוגה טיפולית.',
      'אמנית ומורה לאמנות חזותית עם ניסיון של יותר מעשרים שנה.',
      'חיה ועובדת בישראל.'
    ],
    bio: 'לביוגרפיה המלאה',
    portraitAlt: 'סנדרה לייפר',
    classH: 'שיעורי יוגה עם סנדרה',
    class: 'סנדרה מעבירה שיעורי יוגה. את הסגנון, הפורמט, המקום, השפה והזמן מתאמים אישית: כתבו לה בוואטסאפ.',
    wa: 'שלום סנדרה, קראתי על יוגה באתר שלך ואשמח לשמוע על השיעורים.',
    faqH: 'שאלות נפוצות על יוגה עם סנדרה',
    faq: [
      ['מה זו יוגה?', 'יוגה היא תרגול עתיק שמקורו בהודו. בשיעורים בימינו היא משלבת תנוחות, נשימה והרפיה, ולפעמים גם מדיטציה.'],
      ['האם סנדרה לייפר מעבירה שיעורי יוגה?', 'כן. לסנדרה יש ניסיון בכמה סוגי יוגה והיא מעבירה שיעורי יוגה. את הפרטים מתאמים אישית בוואטסאפ: 053-538-0014.'],
      ['אילו סגנונות יוגה סנדרה מלמדת?', 'יש לה ניסיון בכמה סוגי יוגה. באילו כיוונים ובאיזה פורמט היא מעבירה שיעורים, כדאי לברר איתה בוואטסאפ.'],
      ['איך נרשמים לשיעור יוגה?', 'כותבים לסנדרה בוואטסאפ: 053-538-0014. את הפורמט, המקום, השפה והזמן מתאמים אישית.'],
      ['יוגה היא טיפול?', 'יוגה היא תרגול של תנועה, נשימה ותשומת לב. היא לא מחליפה עזרה רפואית או פסיכולוגית, ואם יש בעיות בריאותיות כדאי להתייעץ קודם עם רופא.'],
      ['אפשר לשלב יוגה ויצירה?', 'סנדרה היא אמנית, והשיטה שלה משלבת תנועת גוף, נשימה, מחווה, אלתור ונוירוגרפיקה. פרטים נוספים בעמוד על נוירוגרפיקה.']
    ],
    endH: 'רוצים לשמוע על שיעורי יוגה?',
    end: 'כתבו לסנדרה בוואטסאפ וספרו מה מעניין אתכם.',
    phone: 'טלפון ווואטסאפ:',
    home: 'סנדרה לייפר',
    homeLink: 'יוגה עם סנדרה'
  },
  en: {
    title: 'Yoga with Sandra Leifer: Classes and Practice | Sandra Leifer',
    desc: 'Yoga with Sandra Leifer: she has experience in several types of yoga and teaches yoga classes. About the practice, yoga styles and how to write on WhatsApp.',
    ogAlt: 'Yoga with Sandra Leifer',
    crumb: 'Yoga',
    nav: {what: 'About yoga', styles: 'Styles', about: 'About Sandra', faq: 'Questions', neuro: 'NeuroGraphica'},
    h1: 'Yoga', h1Sub: 'with Sandra Leifer: practice and classes',
    lead: 'Yoga is a practice that joins movement, breath and attention to the body. Sandra Leifer has experience in several types of yoga and teaches yoga classes. Here is a short introduction to the practice and how to contact her.',
    by: 'Sandra Leifer is an artist and visual-arts teacher. Her biography on this site also lists yoga therapy among her fields.',
    ctaBook: 'Write to Sandra on WhatsApp',
    ctaNeuro: 'NeuroGraphica with Sandra',
    heroCap: 'From Sandra’s works: “{title}”',
    whatH: 'What is yoga',
    what: [
      'Yoga is an ancient practice that comes from India. In classes today it is usually presented as a combination of postures (asanas), breathing and relaxation, and sometimes meditation.',
      'Different styles put the emphasis in different places: some have more flowing movement, some long holds of postures, some quiet recovery. That is why it matters to choose a practice that suits you.',
      'Yoga is a practice, not a medical treatment. If you have health problems, an injury or are pregnant, it is worth talking to a doctor before you start.'
    ],
    stylesH: 'Common styles of yoga',
    stylesNote: 'This is a general overview of yoga styles, not a list of what Sandra teaches. Which styles she leads and in what format, ask her directly on WhatsApp.',
    styles: [
      ['Hatha yoga', 'A general name for practices with postures and breathing. Usually a calm pace and attention to how each posture is done.'],
      ['Vinyasa yoga', 'Postures are joined into a flowing sequence, and the movement is tied to the breath.'],
      ['Yin yoga', 'A slow practice: passive postures are held for a long time, in relaxation.'],
      ['Restorative yoga', 'A gentle practice with supports (cushions, bolsters, blankets) and an emphasis on rest.'],
      ['Yoga therapy', 'Yoga adapted to the needs of a particular person. It does not replace medical care.']
    ],
    expectH: 'What a yoga class is usually like',
    expect: [
      'A class usually includes a warm-up, postures, breathing exercises and a final relaxation. You need a mat and comfortable clothes.',
      'The format of classes with Sandra, the place, language and time are agreed personally: write to her on WhatsApp.'
    ],
    artH: 'Yoga and creativity',
    art: 'Sandra is developing her own method of group creative self-exploration, which combines movement, breathing, gesture, artistic improvisation and NeuroGraphica. If this meeting of body practice and drawing appeals to you, have a look at the NeuroGraphica page.',
    artLink: 'NeuroGraphica: what it is and how to learn it with Sandra',
    aboutH: 'Who leads it: Sandra Leifer',
    facts: [
      'Has experience in several types of yoga and teaches yoga classes.',
      'Her biography on this site lists yoga therapy among her fields.',
      'Artist and visual-arts teacher with more than 20 years of experience.',
      'Lives and works in Israel.'
    ],
    bio: 'Full biography',
    portraitAlt: 'Sandra Leifer',
    classH: 'Yoga classes with Sandra',
    class: 'Sandra teaches yoga classes. The style, format, place, language and time are agreed personally: write to her on WhatsApp.',
    wa: 'Hello Sandra, I read about yoga on your website and would like to hear about the classes.',
    faqH: 'Frequently asked questions about yoga with Sandra',
    faq: [
      ['What is yoga?', 'Yoga is an ancient practice that comes from India. In classes today it combines postures, breathing and relaxation, and sometimes meditation.'],
      ['Does Sandra Leifer teach yoga classes?', 'Yes. Sandra has experience in several types of yoga and teaches yoga classes. The details are agreed personally on WhatsApp: +972 53-538-0014.'],
      ['Which styles of yoga does Sandra teach?', 'She has experience in several types of yoga. Which styles she leads and in what format, ask her on WhatsApp.'],
      ['How do I sign up for a yoga class?', 'Write to Sandra on WhatsApp: +972 53-538-0014. The format, place, language and time are agreed personally.'],
      ['Is yoga a therapy?', 'Yoga is a practice of movement, breath and attention. It does not replace medical or psychological help, and with health problems it is best to talk to a doctor first.'],
      ['Can yoga be combined with creativity?', 'Sandra is an artist, and her own method combines movement, breathing, gesture, improvisation and NeuroGraphica. More on the NeuroGraphica page.']
    ],
    endH: 'Would you like to hear about yoga classes?',
    end: 'Write to Sandra on WhatsApp and tell her what interests you.',
    phone: 'Phone and WhatsApp:',
    home: 'Sandra Leifer',
    homeLink: 'Yoga with Sandra'
  }
};
