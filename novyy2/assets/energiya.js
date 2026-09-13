/* Анимации главной нового сайта. Все редкие, один раз или по наведению:
   плёнка наматывается на заголовок, энергия у руки Проводника чуть следует за указателем,
   короба поднимаются на полку, когда стеллаж попадает в экран. При «уменьшить движение» — ничего. */
(function () {
  var tiho = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!tiho) document.body.classList.add('m-anim');

  var st = document.querySelector('[data-stellazh]');
  if (st) {
    var postavit = function () { st.classList.add('na-meste'); setTimeout(function () { st.classList.add('gotovo'); }, 1700); };
    if (tiho || !('IntersectionObserver' in window)) postavit();
    else {
      var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { postavit(); io.disconnect(); } }, { rootMargin: '0px 0px -18% 0px' });
      io.observe(st);
    }
  }

  var hero = document.querySelector('.m-hero'), art = document.querySelector('.m-hero-art');
  if (hero && art && !tiho && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var raf = 0, mx = 0, my = 0;
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - .5; my = (e.clientY - r.top) / r.height - .5;
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; art.style.setProperty('--mx', mx.toFixed(3)); art.style.setProperty('--my', my.toFixed(3)); });
    });
    hero.addEventListener('pointerleave', function () { art.style.setProperty('--mx', 0); art.style.setProperty('--my', 0); });
  }

  var h1 = document.querySelector('.m-h1');
  if (h1 && !tiho) (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () { h1.classList.add('namotka'); });
})();
