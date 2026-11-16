// Body-art gallery (/body-art/): the images in dist/assets/img/body-art/ (<id>-800.webp, <id>-1600.webp).
// w/h = the 1600 file, w8/h8 = the 800 file, c = average colour (the hero-wall tile placeholder; tools/build-thumbs.py prints it). No titles, years or sizes exist for these photos, so none are given.
// review: 'nudity' marks partly nude photos awaiting the Owner's decision. To take them off the page change hideReview to ['nudity'] and rebuild (node tools/build-pages.mjs); or delete the entries.
// Review-tagged files: those entries below carry review: 'nudity'.
// year: the contest year (Owner, 2026-11-14: body-art-13 is the 2025 contest, the event-* photos the 2026 one); a group with years shows one h3 sub-section per year, oldest first.
// credit: the photographer's name where it is visible on the photo.
// Dropped as a second photo of the same model (Owner, 2026-11-15: one photo per model): body-art-event-01 and body-art-event-04 (= event-02), body-art-07 (= 17), body-art-18 (= 02), body-art-16 (= 11), body-art-20 (= 10).
// Dropped as duplicates of catalog works (same shoot and model, shown on /body-art/ through the catalog cards): body-art-01 = smoke, body-art-14 and body-art-15 = gaze, body-art-06 = chromatic-reverie; body-art-event-03 = near-identical frame of event-02.
window.BODY_ART = {
  hideReview: [],
  items: [
    {id: 'body-art-02', group: 'art', w: 1067, h: 1600, w8: 534, h8: 800, c: '#292521'},
    {id: 'body-art-03', group: 'art', w: 1067, h: 1600, w8: 534, h8: 800, c: '#191311'},
    {id: 'body-art-04', group: 'art', w: 912, h: 1600, w8: 456, h8: 800, c: '#433f40'},
    {id: 'body-art-05', group: 'art', w: 1058, h: 1600, w8: 529, h8: 800, c: '#3f4240', review: 'nudity'},
    {id: 'body-art-08', group: 'art', w: 1067, h: 1600, w8: 534, h8: 800, c: '#1f1512', review: 'nudity'},
    {id: 'body-art-09', group: 'art', w: 1600, h: 1067, w8: 800, h8: 534, c: '#352e28'},
    {id: 'body-art-10', group: 'art', w: 1067, h: 1600, w8: 534, h8: 800, c: '#3d221b'},
    {id: 'body-art-11', group: 'art', w: 1600, h: 1065, w8: 800, h8: 533, c: '#5b4c39', credit: 'Susanna'},
    {id: 'body-art-12', group: 'art', w: 1106, h: 1600, w8: 553, h8: 800, c: '#43525e', review: 'nudity'},
    {id: 'body-art-13', group: 'events', year: '2025', w: 1067, h: 1600, w8: 534, h8: 800, c: '#251c1b'},
    {id: 'body-art-17', group: 'art', w: 1078, h: 1600, w8: 539, h8: 800, c: '#94827b'},
    {id: 'body-art-19', group: 'art', w: 1026, h: 1294, w8: 635, h8: 800, c: '#0f1010'},
    {id: 'body-art-21', group: 'art', w: 1068, h: 1600, w8: 534, h8: 800, c: '#5f4741'},
    {id: 'body-art-event-02', group: 'events', year: '2026', w: 1067, h: 1600, w8: 534, h8: 800, c: '#695f62'},
  ]
};
