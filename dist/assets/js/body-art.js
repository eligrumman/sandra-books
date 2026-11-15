// Minimal accessible lightbox for /body-art/: a native <dialog>, arrows and Esc, focus returns to the photo that opened it.
// The museum's mirror room opens the same dialog through window.baLightbox.open(photos, index, opener, onClose).
(function () {
  var dlg = document.getElementById('baLb');
  if (!dlg || typeof dlg.showModal !== 'function') return; // without it the links simply open the large photo
  var img = document.getElementById('baLbImg'), cap = document.getElementById('baLbCap'), count = document.getElementById('baLbCount');
  var list = [], cur = 0, opener = null, done = null;
  function show(i) {
    cur = (i + list.length) % list.length;
    var p = list[cur];
    img.src = p.src;
    img.alt = p.alt;
    img.width = p.w; img.height = p.h;
    cap.textContent = p.cap || '';
    count.textContent = (cur + 1) + ' / ' + list.length;
  }
  // photos: [{src, alt, w, h, cap}]; onClose(index) is told which photo was showing when it closed
  function open(photos, i, from, onClose) {
    list = photos; opener = from || null; done = onClose || null;
    show(i); dlg.showModal(); document.getElementById('baLbClose').focus();
  }
  var links = Array.prototype.slice.call(document.querySelectorAll('.ba-item a'));
  var photos = links.map(function (a) {
    var credit = a.parentNode.querySelector('.ba-credit');
    return {src: a.getAttribute('href'), alt: a.querySelector('img').alt, w: a.dataset.w, h: a.dataset.h, cap: credit ? credit.textContent : ''};
  });
  links.forEach(function (a, i) {
    a.addEventListener('click', function (e) { e.preventDefault(); open(photos, i, a); });
  });
  document.getElementById('baLbPrev').addEventListener('click', function () { show(cur - 1); });
  document.getElementById('baLbNext').addEventListener('click', function () { show(cur + 1); });
  document.getElementById('baLbClose').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', function (e) {
    var rtl = document.documentElement.dir === 'rtl';
    if (e.key === 'ArrowRight') { show(cur + (rtl ? -1 : 1)); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { show(cur + (rtl ? 1 : -1)); e.preventDefault(); }
  });
  dlg.addEventListener('close', function () { img.removeAttribute('src'); if (opener) opener.focus(); var f = done; done = null; if (f) f(cur); });
  window.baLightbox = {open: open, dialog: dlg};
})();
