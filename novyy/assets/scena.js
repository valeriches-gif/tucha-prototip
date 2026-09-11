/* Сцена «Мира Тучи»: туча сверху, земля снизу, постройка из блоков-коробок,
   слева мальчик-проводник, справа фишка выбранного персонажа.
   Одна сцена работает на главной, в игре и в кабинете.
   Без библиотек: SVG и CSS-переходы. При отключённой анимации
   коробки просто появляются на месте. */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var SHRIFT = 'Golos Text, Segoe UI, sans-serif';
  var BLOKI = {
    hranenie:  { ig: 'Точка сохранения', ob: 'хранение',    x: 296, y: 290, w: 248, h: 70, fill: '#1E3A5F', tx: '#FFFFFF', opora: null },
    obrabotka: { ig: 'Мастерская',       ob: 'обработка',   x: 304, y: 216, w: 114, h: 70, fill: '#1E90D2', tx: '#FFFFFF', opora: 'hranenie' },
    lavka:     { ig: 'Лавка',            ob: 'маркетплейс', x: 422, y: 216, w: 114, h: 70, fill: '#EF7F1A', tx: '#FFFFFF', opora: 'hranenie', skoro: true },
    vitrina:   { ig: 'Витрина',          ob: 'продвижение', x: 436, y: 160, w: 86,  h: 52, fill: '#F7B267', tx: '#1E3A5F', opora: 'lavka', skoro: true },
    dostavka:  { ig: 'Телепорт',         ob: 'доставка',    x: 150, y: 302, w: 104, h: 58, fill: '#5AAEE0', tx: '#FFFFFF', opora: null },
    tamozhnya: { ig: 'Портал',           ob: 'таможня',     x: 602, y: 302, w: 104, h: 58, fill: '#2C5486', tx: '#FFFFFF', opora: null }
  };
  var PORYADOK = ['hranenie', 'obrabotka', 'lavka', 'vitrina', 'dostavka', 'tamozhnya'];
  var KANAL = { zvonok: 'звонок', pochta: 'почта', messenger: 'мессенджер', vstrecha: 'встреча', chat: 'чат на сайте' };
  var PERS = {
    shturman: { ig: 'Штурман', b: 'Ш' }, hranitel: { ig: 'Хранитель', b: 'Х' },
    arhitektor: { ig: 'Архитектор', b: 'А' }, pomoshnik: { ig: 'Помощник', b: 'П' }, auto: { ig: 'Менеджер', b: 'М' }
  };

  function el(n, a, p) {
    var e = document.createElementNS(NS, n);
    for (var k in a) e.setAttribute(k, a[k]);
    if (p) p.appendChild(e);
    return e;
  }
  function tekst(p, x, y, s, a) {
    var t = el('text', Object.assign({ x: x, y: y, 'text-anchor': 'middle', 'font-family': SHRIFT }, a || {}), p);
    t.textContent = s;
    return t;
  }
  function tixo() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function pauza(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function Scena(svg, opts) {
    opts = opts || {};
    this.svg = svg; this.root = opts.root || './'; this.est = {}; this.och = Promise.resolve();
    svg.setAttribute('viewBox', '0 0 720 420');
    svg.innerHTML = '';
    el('rect', { x: 0, y: 360, width: 720, height: 60, fill: '#D6E4F1' }, svg);
    el('rect', { x: 0, y: 360, width: 720, height: 3, fill: '#B9CDE2' }, svg);
    this.stroyka = el('g', {}, svg);
    this.lyudi = el('g', {}, svg);
    if (opts.malchik !== false) {
      this.malchik = el('g', { 'class': 'malchik-g' }, svg);
      el('ellipse', { cx: 57, cy: 362, rx: 34, ry: 5, fill: 'rgba(30,58,95,.16)' }, this.malchik);
      el('image', { href: this.root + 'assets/img/maskot.webp', x: 14, y: 206, width: 86, height: 155 }, this.malchik);
    }
    this.tucha = el('g', { 'class': 'tucha-g' }, svg);
    var t = this.tucha;
    [[360, 98, 36], [420, 80, 50], [482, 94, 40]].forEach(function (c) {
      el('circle', { cx: c[0] + 6, cy: c[1] + 8, r: c[2], fill: '#5AAEE0' }, t);
    });
    [[316, 112, 26], [360, 94, 38], [420, 74, 52], [482, 90, 42], [528, 108, 28]].forEach(function (c) {
      el('circle', { cx: c[0], cy: c[1], r: c[2], fill: '#1E90D2' }, t);
    });
    el('rect', { x: 310, y: 100, width: 222, height: 38, rx: 19, fill: '#1E90D2' }, t);
    this.nadpis = el('g', { opacity: 0 }, svg);
  }

  Scena.prototype.korobka = function (k) {
    var b = BLOKI[k];
    var g = el('g', { 'class': 'blok-g', 'data-blok': k });
    el('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 8, fill: b.fill }, g);
    el('rect', { x: b.x, y: b.y, width: b.w, height: 6, rx: 3, fill: 'rgba(255,255,255,.18)' }, g);
    var cx = b.x + b.w / 2, mal = b.w < 110;
    tekst(g, cx, b.y + b.h / 2 - (mal ? 1 : 3), b.ig, { fill: b.tx, 'font-size': mal ? 11.5 : 14, 'font-weight': 700 });
    tekst(g, cx, b.y + b.h / 2 + (mal ? 13 : 15), b.ob, { fill: b.tx, 'fill-opacity': .82, 'font-size': mal ? 10 : 12 });
    if (b.skoro) {
      el('rect', { x: b.x + 1, y: b.y + 1, width: b.w - 2, height: b.h - 2, rx: 7, fill: 'none',
        stroke: '#1E3A5F', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, g);
      tekst(g, b.x + b.w - 6, b.y - 5, 'СКОРО', { 'text-anchor': 'end', fill: '#C8650F', 'font-size': 10, 'font-weight': 700 });
    }
    return g;
  };

  Scena.prototype.prygni = function () {
    var m = this.malchik;
    if (!m || tixo()) return;
    m.classList.remove('pryg'); m.getBoundingClientRect(); m.classList.add('pryg');
  };

  Scena.prototype.dobavit = function (k, anim) {
    if (this.est[k]) return Promise.resolve();
    var g = this.korobka(k), self = this;
    this.est[k] = g;
    this.stroyka.appendChild(g);
    if (!anim || tixo()) return Promise.resolve();
    g.style.transform = 'translateY(-440px)';
    g.getBoundingClientRect();
    requestAnimationFrame(function () { g.style.transform = 'translateY(0)'; });
    return pauza(720).then(function () { self.prygni(); return pauza(150); });
  };

  Scena.prototype.ubrat = function (k, anim) {
    var g = this.est[k];
    if (!g) return;
    delete this.est[k];
    if (!anim || tixo()) { g.remove(); return; }
    g.style.transform = 'translateY(-440px)';
    g.style.opacity = '0';
    setTimeout(function () { g.remove(); }, 650);
  };

  /* Привести постройку к набору блоков: лишние уезжают в тучу,
     новые падают по очереди — фундамент первым. Возвращает список упавших. */
  Scena.prototype.obnovit = function (bloki, anim) {
    var self = this, novye = [];
    Object.keys(self.est).forEach(function (k) { if (!bloki[k]) self.ubrat(k, anim); });
    PORYADOK.forEach(function (k) {
      if (bloki[k] && !self.est[k]) {
        novye.push(k);
        self.och = self.och.then(function () { return self.dobavit(k, anim); });
      }
    });
    return self.och.then(function () { return novye; });
  };

  /* Фишка персонажа — как в настольной игре: кружок с буквой на подставке. */
  Scena.prototype.persona = function (p) {
    this.lyudi.innerHTML = '';
    this.p = p;
    if (!p) return;
    var d = PERS[p] || PERS.auto, g = el('g', { 'class': 'fishka-g' }, this.lyudi);
    el('ellipse', { cx: 573, cy: 359, rx: 20, ry: 5, fill: 'rgba(30,58,95,.2)' }, g);
    el('rect', { x: 567, y: 336, width: 12, height: 22, rx: 3, fill: '#1E3A5F' }, g);
    el('circle', { cx: 573, cy: 318, r: 21, fill: '#FFFFFF', stroke: '#EF7F1A', 'stroke-width': 4 }, g);
    tekst(g, 573, 325, d.b, { fill: '#1E3A5F', 'font-size': 19, 'font-weight': 800 });
    tekst(this.lyudi, 573, 386, d.ig, { fill: '#1E3A5F', 'font-size': 12, 'font-weight': 700 });
    if (this.k) this.kanal(this.k);
  };

  Scena.prototype.kanal = function (k) {
    this.k = k;
    var st = this.lyudi.querySelector('[data-kanal]');
    if (st) st.remove();
    if (!k || !this.p) return;
    var g = el('g', { 'data-kanal': 1 }, this.lyudi);
    el('path', { d: 'M522 128 Q600 210 574 294', fill: 'none', stroke: '#EF7F1A', 'stroke-width': 2.5,
      'stroke-dasharray': '5 6', 'class': 'kanal-liniya' }, g);
    var s = KANAL[k] || k, w = s.length * 7.4 + 24;
    el('rect', { x: 588 - w / 2, y: 196, width: w, height: 26, rx: 13, fill: '#FFFFFF', stroke: '#EF7F1A', 'stroke-width': 1.5 }, g);
    tekst(g, 588, 213, s, { fill: '#1E3A5F', 'font-size': 12.5, 'font-weight': 600 });
  };

  /* Финал: туча разрастается и накрывает постройку, ложится печать. */
  Scena.prototype.final = function (nadpis, pechatSrc) {
    var self = this;
    self.nadpis.innerHTML = '';
    tekst(self.nadpis, 420, 200, nadpis || 'Всё под одной тучей', { fill: '#FFFFFF', 'font-size': 32, 'font-weight': 800 });
    if (pechatSrc) {
      var p = el('g', { 'class': 'pechat-g' }, self.nadpis);
      el('circle', { cx: 420, cy: 283, r: 62, fill: '#FFFFFF' }, p);
      el('image', { href: pechatSrc, x: 362, y: 220, width: 116, height: 126 }, p);
      tekst(p, 420, 281, 'МИР', { fill: '#1E3A5F', 'font-size': 15, 'font-weight': 800, 'letter-spacing': '.08em' });
      tekst(p, 420, 297, 'СОХРАНЁН', { fill: '#EF7F1A', 'font-size': 10.5, 'font-weight': 800, 'letter-spacing': '.06em' });
    }
    self.tucha.style.transform = 'scale(3.4)';
    if (tixo()) { self.nadpis.setAttribute('opacity', 1); return Promise.resolve(); }
    return pauza(1200).then(function () {
      self.nadpis.style.transition = 'opacity .45s'; self.nadpis.setAttribute('opacity', 1);
      self.nadpis.classList.add('udar');
      return pauza(800);
    });
  };

  window.TuchaScena = {
    BLOKI: BLOKI, PORYADOK: PORYADOK, PERS: PERS, KANAL: KANAL,
    sozdat: function (svg, opts) { return new Scena(svg, opts); }
  };
})();
