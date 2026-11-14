// Minimal accessible lightbox for /body-art/: a native <dialog>, arrows and Esc, focus returns to the photo that opened it.
(function () {
  var dlg = document.getElementById('baLb');
  if (!dlg || typeof dlg.showModal !== 'function') return; // without it the links simply open the large photo
  var links = Array.prototype.slice.call(document.querySelectorAll('.ba-item a'));
  var img = document.getElementById('baLbImg'), cap = document.getElementById('baLbCap'), count = document.getElementById('baLbCount');
  var cur = 0, opener = null;
  function show(i) {
    cur = (i + links.length) % links.length;
    var a = links[cur], thumb = a.querySelector('img');
    img.src = a.getAttribute('href');
    img.alt = thumb.alt;
    img.width = a.dataset.w; img.height = a.dataset.h;
    var credit = a.parentNode.querySelector('.ba-credit');
    cap.textContent = credit ? credit.textContent : '';
    count.textContent = (cur + 1) + ' / ' + links.length;
  }
  links.forEach(function (a, i) {
    a.addEventListener('click', function (e) { e.preventDefault(); opener = a; show(i); dlg.showModal(); document.getElementById('baLbClose').focus(); });
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
  dlg.addEventListener('close', function () { img.removeAttribute('src'); if (opener) opener.focus(); });
})();
