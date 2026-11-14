// Body-art gallery (/body-art/): the images in dist/assets/img/body-art/ (<id>-800.webp, <id>-1600.webp).
// w/h = the 1600 file, w8/h8 = the 800 file. No titles, years or sizes exist for these photos, so none are given.
// review: 'nudity' marks partly nude photos awaiting the Owner's decision. To take them off the page change hideReview to ['nudity'] and rebuild (node tools/build-pages.mjs); or delete the entries.
// Review-tagged files: those entries below carry review: 'nudity'.
// credit: the photographer's name where it is visible on the photo.
window.BODY_ART = {
  hideReview: [],
  items: [
    {id: 'body-art-01', group: 'art', w: 1268, h: 1600, w8: 634, h8: 800},
    {id: 'body-art-02', group: 'art', w: 1067, h: 1600, w8: 534, h8: 800},
    {id: 'body-art-03', group: 'art', w: 1067, h: 1600, w8: 534, h8: 800},
    {id: 'body-art-04', group: 'art', w: 912, h: 1600, w8: 456, h8: 800},
    {id: 'body-art-05', group: 'art', w: 1058, h: 1600, w8: 529, h8: 800, review: 'nudity'},
    {id: 'body-art-06', group: 'art', w: 1066, h: 1600, w8: 533, h8: 800},
    {id: 'body-art-07', group: 'art', w: 1067, h: 1600, w8: 534, h8: 800, review: 'nudity'},
    {id: 'body-art-08', group: 'art', w: 1067, h: 1600, w8: 534, h8: 800, review: 'nudity'},
    {id: 'body-art-09', group: 'art', w: 1600, h: 1067, w8: 800, h8: 534},
    {id: 'body-art-10', group: 'art', w: 1067, h: 1600, w8: 534, h8: 800},
    {id: 'body-art-11', group: 'art', w: 1600, h: 1065, w8: 800, h8: 533, credit: 'Susanna'},
    {id: 'body-art-12', group: 'art', w: 1106, h: 1600, w8: 553, h8: 800, review: 'nudity'},
    {id: 'body-art-13', group: 'art', w: 1067, h: 1600, w8: 534, h8: 800},
    {id: 'body-art-14', group: 'art', w: 1067, h: 1600, w8: 534, h8: 800},
    {id: 'body-art-15', group: 'art', w: 1067, h: 1600, w8: 534, h8: 800},
    {id: 'body-art-16', group: 'art', w: 1067, h: 1600, w8: 534, h8: 800},
    {id: 'body-art-17', group: 'art', w: 1078, h: 1600, w8: 539, h8: 800},
    {id: 'body-art-18', group: 'art', w: 1067, h: 1600, w8: 534, h8: 800},
    {id: 'body-art-19', group: 'art', w: 1026, h: 1294, w8: 635, h8: 800},
    {id: 'body-art-20', group: 'art', w: 1270, h: 1600, w8: 635, h8: 800},
    {id: 'body-art-event-01', group: 'events', w: 1200, h: 1600, w8: 600, h8: 800},
    {id: 'body-art-event-02', group: 'events', w: 1067, h: 1600, w8: 534, h8: 800},
    {id: 'body-art-event-03', group: 'events', w: 1067, h: 1600, w8: 534, h8: 800},
    {id: 'body-art-event-04', group: 'events', w: 1067, h: 1600, w8: 534, h8: 800, review: 'nudity'}
  ]
};
