/* Сцена «Мира Тучи»: летающий остров-двор склада и Туча над ним.
   Блоки падают из тучи ящиками, ударяются о площадку и вырастают
   в здания. Мир живёт: туча покачивается, грузовик ездит между
   Телепортом и Порталом, в Мастерской крутится шестерёнка, кран на
   стройке Лавки качает ящик. Менеджер собирается из блоков по критериям.
   Рисунки — в izo.js. При отключённой анимации всё просто стоит. */
(function () {
  var I = window.TuchaIzo, el = I.el, txt = I.txt, P = I.P, boks = I.boks;
  var BLOKI = {
    hranenie: { ig: 'Точка сохранения', ob: 'хранение', fill: '#1E3A5F', opora: null },
    obrabotka: { ig: 'Мастерская', ob: 'обработка', fill: '#1E90D2', opora: 'hranenie' },
    lavka: { ig: 'Лавка', ob: 'маркетплейс', fill: '#EF7F1A', opora: 'hranenie' },
    vitrina: { ig: 'Витрина', ob: 'продвижение', fill: '#F7B267', opora: 'lavka' },
    dostavka: { ig: 'Телепорт', ob: 'доставка', fill: '#5AAEE0', opora: null },
    tamozhnya: { ig: 'Портал', ob: 'таможня', fill: '#2C5486', opora: null }
  };
  var PORYADOK = ['hranenie', 'obrabotka', 'lavka', 'vitrina', 'dostavka', 'tamozhnya'];
  var KANAL = { zvonok: 'звонок', pochta: 'почта', messenger: 'мессенджер', vstrecha: 'встреча', chat: 'чат на сайте' };
  var PERS = {
    shturman: { ig: 'Штурман', b: 'Ш' }, hranitel: { ig: 'Хранитель', b: 'Х' },
    arhitektor: { ig: 'Архитектор', b: 'А' }, pomoshnik: { ig: 'Помощник', b: 'П' }, auto: { ig: 'Персонаж', b: 'Т' }
  };
  /* какой собранный менеджер у готовых персонажей — для кабинета и старых анкет */
  var SBORKA = {
    shturman: { harakter: 'shturman' }, hranitel: { harakter: 'hranitel' }, arhitektor: { harakter: 'arhitektor' },
    pomoshnik: { bot: true }, auto: {}
  };
  var MX = 6.0, MY = 4.4;                    // где стоит менеджер
  var schet = 0;

  function tixo() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function pauza(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  var EASE = {
    vniz: function (t) { return t * t; },
    myagko: function (t) { return 1 - (1 - t) * (1 - t); },
    pruzhina: function (t) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    oba: function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  };
  function tween(ms, ease, f) {
    return new Promise(function (r) {
      var t0 = null;
      function k(now) {
        if (t0 === null) t0 = now;
        var t = Math.min(1, (now - t0) / ms);
        f(ease(t));
        if (t < 1) requestAnimationFrame(k); else r();
      }
      requestAnimationFrame(k);
    });
  }
  function masshtab(g, x, y, s) { g.setAttribute('transform', 'translate(' + x + ',' + y + ') scale(' + s + ') translate(' + -x + ',' + -y + ')'); }

  function Scena(svg, o) {
    o = o || {};
    this.svg = svg; this.o = o; this.root = o.root || './';
    this.est = {}; this.och = Promise.resolve(); this.animBl = {}; this.id = 'iz' + (++schet);
    this.podp = !!o.podpisi;
    svg.setAttribute('viewBox', o.viewBox || '110 30 580 490');
    svg.innerHTML = '';
    I.defs(svg, this.id);
    this.mir = el('g', {}, svg);
    I.ostrov(this.mir);
    I.doroga(this.mir);
    this.animBl.dekor = [];
    I.dekor(this.mir, { anim: this.animBl.dekor });
    var zad = el('g', {}, this.mir), zd = el('g', {}, this.mir), self = this;
    this.gr = {};
    ['dostavka', 'tamozhnya'].forEach(function (k) { self.gr[k] = el('g', { 'data-blok': k }, zad); });
    ['hranenie', 'lavka', 'vitrina', 'obrabotka'].forEach(function (k) { self.gr[k] = el('g', { 'data-blok': k }, zd); });
    if (o.onKlik) {
      svg.classList.add('klik');
      Object.keys(self.gr).forEach(function (k) {
        var g = self.gr[k];
        g.setAttribute('tabindex', '0'); g.setAttribute('role', 'link');
        g.setAttribute('aria-label', BLOKI[k].ig + ', ' + BLOKI[k].ob + ': подробнее');
        g.addEventListener('click', function () { o.onKlik(k); });
        g.addEventListener('keydown', function (e) { if (e.key === 'Enter') o.onKlik(k); });
      });
    }
    this.lyudi = el('g', {}, this.mir);
    this.mashiny = el('g', {}, this.mir);
    this.sprayty = {};
    [['ax', 'x', 1], ['axn', 'x', -1], ['by', 'y', -1], ['byp', 'y', 1]].forEach(function (s) {
      var g = el('g', { style: 'display:none' }, self.mashiny);
      I.gruzovik(g, s[1], s[2]);
      self.sprayty[s[0]] = g;
    });
    this.chastitsy = el('g', {}, svg);
    this.yaschiki = el('g', {}, svg);
    this.tuchaG = el('g', {}, svg);
    I.tucha(this.tuchaG);
    this.kanalG = el('g', {}, svg);
    this.podpG = el('g', { 'class': 'podpisi' }, svg);
    this.nadpis = el('g', { opacity: 0 }, svg);
    this.zhivoy();
  }

  Scena.prototype.ctx = function (k) { this.animBl[k] = []; return { anim: this.animBl[k], id: this.id, est: this.est }; };
  Scena.prototype.risovat = function (k, t) {
    var g = this.gr[k];
    g.innerHTML = '';
    if (t > 0.001) I.RIS[k](g, t, this.ctx(k));
    else this.animBl[k] = [];
  };

  /* ---------- частицы и удар ---------- */
  Scena.prototype.pyl = function (x, y) {
    if (tixo()) return;
    var g = this.chastitsy, ch = [];
    for (var i = 0; i < 12; i++) {
      var a = Math.PI * 2 * i / 12 + Math.random() * .4, r = 26 + Math.random() * 30;
      ch.push({ e: el('ellipse', { cx: x, cy: y, rx: 5, ry: 2.6, fill: '#FFFFFF', opacity: .95 }, g), dx: Math.cos(a) * r, dy: Math.sin(a) * r * .5 });
    }
    tween(520, EASE.myagko, function (t) {
      ch.forEach(function (c) { c.e.setAttribute('cx', x + c.dx * t); c.e.setAttribute('cy', y + c.dy * t - 6 * t); c.e.setAttribute('opacity', (1 - t) * .95); });
    }).then(function () { ch.forEach(function (c) { c.e.remove(); }); });
  };
  Scena.prototype.iskry = function (x, y) {
    if (tixo()) return;
    var g = this.chastitsy, ch = [];
    for (var i = 0; i < 8; i++) {
      var a = Math.PI * 2 * i / 8, r = 34 + Math.random() * 22;
      var s = el('path', { d: 'M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6 Z', fill: i % 2 ? '#EF7F1A' : '#FFFFFF' }, g);
      ch.push({ e: s, dx: Math.cos(a) * r, dy: Math.sin(a) * r * .6 - 20 });
    }
    tween(700, EASE.myagko, function (t) {
      ch.forEach(function (c) {
        var sc = t < .5 ? t * 2 : (1 - t) * 2;
        c.e.setAttribute('transform', 'translate(' + (x + c.dx * t) + ',' + (y + c.dy * t) + ') scale(' + sc + ')');
      });
    }).then(function () { ch.forEach(function (c) { c.e.remove(); }); });
  };
  Scena.prototype.udar = function () {
    if (tixo()) return;
    var m = this.mir;
    tween(220, EASE.myagko, function (t) { m.setAttribute('transform', 'translate(0,' + (Math.sin(t * Math.PI) * 3).toFixed(2) + ')'); })
      .then(function () { m.removeAttribute('transform'); });
  };

  /* ---------- блоки ---------- */
  Scena.prototype.dobavit = function (k, anim) {
    if (this.est[k]) return Promise.resolve();
    var self = this, geo = I.GEO[k];
    this.est[k] = true;
    if (k === 'vitrina' && this.est.lavka) this.risovat('lavka', 1);            // кран с Лавки уходит
    if ((k === 'obrabotka' || k === 'lavka') && this.est.hranenie) this.risovat('hranenie', 1);
    if (!anim || tixo()) { this.risovat(k, 1); this.podpisi(); return Promise.resolve(); }
    var cx = geo.x + geo.w / 2, cy = geo.y + geo.d / 2, niz = P(cx, cy, geo.z)[1], verh = 150;
    var ya = el('g', {}, this.yaschiki);
    I.yaschik(ya, cx, cy, geo.z, k === 'dostavka' ? 0.8 : 0.72);
    var put = niz - verh - 30;
    ya.setAttribute('transform', 'translate(0,' + -put + ')');
    return tween(560, EASE.vniz, function (t) { ya.setAttribute('transform', 'translate(0,' + (-put * (1 - t)).toFixed(1) + ')'); })
      .then(function () {
        ya.remove();
        self.udar();
        self.pyl(P(cx, cy, geo.z)[0], P(cx, cy, geo.z)[1]);
        if (self.o.naPrizemlenie) self.o.naPrizemlenie(k);
        return tween(560, EASE.pruzhina, function (t) { self.risovat(k, Math.max(.02, t)); });
      })
      .then(function () {
        self.risovat(k, 1);
        var v = P(cx, cy, geo.z + geo.h);
        self.iskry(v[0], v[1]);
        self.podpisi();
        return pauza(140);
      });
  };
  Scena.prototype.ubrat = function (k, anim) {
    if (!this.est[k]) return Promise.resolve();
    var self = this;
    delete this.est[k];
    if (k === 'vitrina' && this.est.lavka) this.risovat('lavka', 1);
    if ((k === 'obrabotka' || k === 'lavka') && this.est.hranenie) this.risovat('hranenie', 1);
    if (!anim || tixo()) { this.risovat(k, 0); this.podpisi(); return Promise.resolve(); }
    return tween(320, EASE.vniz, function (t) { self.risovat(k, 1 - t); }).then(function () { self.risovat(k, 0); self.podpisi(); });
  };
  /* привести постройку к набору блоков: лишние уходят, новые падают по очереди */
  Scena.prototype.obnovit = function (bloki, anim) {
    var self = this, novye = [];
    PORYADOK.slice().reverse().forEach(function (k) { if (self.est[k] && !bloki[k]) self.ubrat(k, anim); });
    PORYADOK.forEach(function (k) {
      if (bloki[k] && !self.est[k]) {
        novye.push(k);
        self.och = self.och.then(function () { return self.dobavit(k, anim); });
      }
    });
    return self.och.then(function () { return novye; });
  };

  /* ---------- менеджер из блоков ---------- */
  var TELO = { shturman: I.C.ora, hranitel: I.C.sklad, arhitektor: I.C.mast };
  var NEYTR = { top: '#C9D6E3', px: '#7E9BB8', py: '#9DB7CF' };
  /* менеджер: ноги, туловище (характер), голова (пол), деталь (возраст или антенна бота) */
  Scena.prototype.menedzher = function (ch, anim, imya) {
    var self = this, g = this.lyudi;
    this.ch = ch || null;
    g.innerHTML = '';
    if (!ch) { this.chPred = 0; this.kanal(this.k); return Promise.resolve(); }
    var x = MX, y = MY, ten = P(x, y, 0), vs = ch.vozrast === '45+', chasti = [];
    el('ellipse', { cx: ten[0], cy: ten[1], rx: 24, ry: 11, fill: 'rgba(30,58,95,.22)' }, g);
    chasti.push(function (G) {
      boks(G, x - .22, y - .11, .18, .22, 0, 20, I.C.sklad);
      boks(G, x + .04, y - .11, .18, .22, 0, 20, I.C.sklad);
    });
    chasti.push(function (G) {
      boks(G, x - .3, y - .17, .6, .34, 20, 30, TELO[ch.harakter] || NEYTR);
      var L = I.granY(G, x - .3, y - .17, .6, .34, 20, 30), c = '#FFFFFF';
      if (ch.harakter === 'shturman') { el('circle', { cx: 10.8, cy: 14, r: 6, fill: 'none', stroke: c, 'stroke-width': 1.8 }, L); el('path', { d: 'M10.8 14 L10.8 10 M10.8 14 L13.4 15.6', stroke: c, 'stroke-width': 1.8, fill: 'none' }, L); }
      if (ch.harakter === 'hranitel') { el('rect', { x: 4.6, y: 9.6, width: 12.4, height: 9, rx: 1.6, fill: c }, L); el('circle', { cx: 10.8, cy: 14.1, r: 2.7, fill: '#1E3A5F' }, L); }
      if (ch.harakter === 'arhitektor') txt(L, 10.8, 19, '₽', { 'font-size': 14, 'font-weight': 800, fill: c });
    });
    chasti.push(function (G) {
      if (ch.bot) {
        boks(G, x - .21, y - .14, .42, .28, 50, 26, { top: '#DDF1FC', px: '#5AAEE0', py: '#9FD8F7' });
        var Lb = I.granY(G, x - .21, y - .14, .42, .28, 50, 26);
        el('rect', { x: 2.5, y: 7, width: 10, height: 10, rx: 2, fill: '#1E3A5F' }, Lb);
        el('rect', { x: 4.4, y: 10, width: 2.2, height: 3, fill: '#5AAEE0' }, Lb);
        el('rect', { x: 8.6, y: 10, width: 2.2, height: 3, fill: '#5AAEE0' }, Lb);
        return;
      }
      var volosy = vs ? { top: '#E3E7EC', px: '#A9B3BF', py: '#C9D0D8' } : ch.pol === 'zh' ? { top: '#9A5B34', px: '#5E3B24', py: '#7A4A2B' } : { top: '#6B4A33', px: '#3F2A1C', py: '#553826' };
      if (ch.pol === 'zh') boks(G, x - .25, y + .02, .5, .14, 34, 42, volosy);
      boks(G, x - .21, y - .14, .42, .28, 50, 26, { top: '#F8E1CC', px: '#D9A988', py: '#EEC5A4' });
      var L = I.granY(G, x - .21, y - .14, .42, .28, 50, 26);
      el('rect', { x: 3.6, y: 10, width: 2.6, height: 3.4, rx: 1, fill: '#1E3A5F' }, L);
      el('rect', { x: 9.4, y: 10, width: 2.6, height: 3.4, rx: 1, fill: '#1E3A5F' }, L);
      el('path', { d: 'M5 18 Q7.6 20 10.4 18', stroke: '#B5654A', 'stroke-width': 1.3, fill: 'none' }, L);
      boks(G, x - .23, y - .16, .46, .32, 76, ch.pol === 'zh' ? 9 : 6, volosy);
    });
    if (ch.vozrast || ch.bot) chasti.push(function (G) {
      var a = P(x, y, ch.pol === 'zh' ? 85 : 82);
      if (ch.bot) { el('line', { x1: a[0], y1: a[1], x2: a[0], y2: a[1] - 12, stroke: '#1E3A5F', 'stroke-width': 1.6 }, G); el('circle', { cx: a[0], cy: a[1] - 14, r: 3.4, fill: '#EF7F1A' }, G); return; }
      if (ch.vozrast === 'do30') { boks(G, x - .24, y - .17, .48, .34, 82, 7, I.C.ora); boks(G, x - .1, y + .17, .3, .22, 82, 2.5, I.C.ora); return; }
      var L = I.granY(G, x - .21, y - .14, .42, .28, 50, 26);
      el('circle', { cx: 4.9, cy: 11.6, r: 3.6, fill: 'rgba(255,255,255,.35)', stroke: '#1E3A5F', 'stroke-width': 1.3 }, L);
      el('circle', { cx: 10.7, cy: 11.6, r: 3.6, fill: 'rgba(255,255,255,.35)', stroke: '#1E3A5F', 'stroke-width': 1.3 }, L);
      el('line', { x1: 8.5, y1: 11.6, x2: 7.1, y2: 11.6, stroke: '#1E3A5F', 'stroke-width': 1.3 }, L);
    });
    var gr = chasti.map(function () { return el('g', {}, g); });
    var podp = txt(g, ten[0], ten[1] + 24, '', { 'font-size': 12, 'font-weight': 800, fill: '#1E3A5F' });
    var bylo = this.chPred || 0, stalo = chasti.length;
    this.chPred = stalo;
    var cep = Promise.resolve();
    chasti.forEach(function (f, i) {
      var nov = anim && !tixo() && i >= bylo;
      if (!nov) { f(gr[i]); return; }
      cep = cep.then(function () {
        f(gr[i]);
        return tween(380, EASE.vniz, function (t) { gr[i].setAttribute('transform', 'translate(0,' + (-130 * (1 - t)).toFixed(1) + ')'); })
          .then(function () { gr[i].removeAttribute('transform'); self.pyl(ten[0], ten[1]); if (self.o.naPrizemlenie) self.o.naPrizemlenie('m'); });
      });
    });
    if (anim && stalo <= bylo) { var v = P(x, y, 70); this.iskry(v[0], v[1]); }
    return cep.then(function () { podp.textContent = imya || ''; self.kanal(self.k); });
  };
  Scena.prototype.persona = function (p) {
    if (!p) return this.menedzher(null);
    this.chPred = 9;
    return this.menedzher(SBORKA[p] || SBORKA.auto, false, (PERS[p] || PERS.auto).ig);
  };
  Scena.prototype.kanal = function (k) {
    this.k = k;
    var g = this.kanalG;
    g.innerHTML = '';
    if (!k || !this.ch) return;
    var t = P(MX, MY, 96);
    el('path', { d: 'M520 142 C 620 200 ' + (t[0] + 90) + ' ' + (t[1] - 40) + ' ' + t[0] + ' ' + t[1], fill: 'none', stroke: '#EF7F1A', 'stroke-width': 2.5, 'stroke-dasharray': '5 6', 'class': 'kanal-liniya' }, g);
    var s = KANAL[k] || k, w = s.length * 7.2 + 24;
    el('rect', { x: 560 - w / 2, y: 170, width: w, height: 26, rx: 13, fill: '#FFFFFF', stroke: '#EF7F1A', 'stroke-width': 1.5 }, g);
    txt(g, 560, 187, s, { 'font-size': 12.5, 'font-weight': 600, fill: '#1E3A5F' });
  };

  /* ---------- подписи зданий ---------- */
  Scena.prototype.podpisi = function (vkl) {
    if (vkl !== undefined) this.podp = vkl;
    var g = this.podpG, self = this;
    g.innerHTML = '';
    if (!this.podp) return;
    PORYADOK.forEach(function (k) {
      if (!self.est[k]) return;
      var p = I.GEO[k].pod, s = BLOKI[k].ig + (BLOKI[k].skoro ? ' · скоро' : ''), w = s.length * 6.6 + 18;
      var x = p[2] === 'end' ? p[0] - w : p[2] === 'start' ? p[0] : p[0] - w / 2;
      el('rect', { x: x, y: p[1] - 14, width: w, height: 20, rx: 10, fill: '#FFFFFF', 'fill-opacity': .94, stroke: '#D6E2EE' }, g);
      txt(g, x + w / 2, p[1] + 0.5, s, { 'font-size': 11, 'font-weight': 700, fill: '#1E3A5F' });
    });
  };

  /* ---------- жизнь мира ---------- */
  Scena.prototype.zhivoy = function () {
    if (tixo() || this.o.statika) return;
    var self = this, t0 = null;
    function kadr(now) {
      if (!self.svg.isConnected) return;
      if (t0 === null) t0 = now;
      var t = (now - t0) / 1000;
      if (!self.finalT) self.tuchaG.setAttribute('transform', 'translate(0,' + (Math.sin(t * 1.3) * 5).toFixed(2) + ')');
      Object.keys(self.animBl).forEach(function (k) {
        self.animBl[k].forEach(function (a) {
          if (a.tip === 'koleso') a.el.setAttribute('transform', 'rotate(' + (t * 70 % 360).toFixed(1) + ' ' + a.cx + ' ' + a.cy + ')');
          else if (a.tip === 'lenta') Array.prototype.forEach.call(a.el.children, function (b, i) {
            var x = 44 + ((i * 16 + t * 14) % 64); b.setAttribute('x', x.toFixed(1)); b.setAttribute('opacity', x > 92 ? 0 : 1);
          });
          else if (a.tip === 'kran') a.el.setAttribute('transform', 'rotate(' + (Math.sin(t * 1.7) * 7).toFixed(2) + ' ' + a.cx + ' ' + a.cy + ')');
          else if (a.tip === 'volna') { var f = (t * .6 + a.faza) % 1; masshtab(a.el, a.cx, a.cy, 1 + f * .7); a.el.setAttribute('opacity', (1 - f).toFixed(2)); }
          else if (a.tip === 'luch') a.el.setAttribute('opacity', (.55 + .35 * Math.sin(t * 2.2)).toFixed(2));
          else if (a.tip === 'portal') a.el.setAttribute('transform', 'rotate(' + (t * 50 % 360).toFixed(1) + ' ' + a.cx + ' ' + a.cy + ')');
          else if (a.tip === 'zvezda') a.el.setAttribute('transform', 'translate(' + a.x.toFixed(1) + ',' + (a.y + Math.sin(t * 2.4) * 2.5).toFixed(1) + ') rotate(' + (Math.sin(t * 1.3) * 10).toFixed(1) + ')');
          else if (a.tip === 'fonar') a.el.setAttribute('opacity', (.7 + .3 * Math.sin(t * 3 + a.faza)).toFixed(2));
        });
      });
      self.gruzovik(t);
      requestAnimationFrame(kadr);
    }
    requestAnimationFrame(kadr);
  };
  Scena.prototype.gruzovik = function (t) {
    var sp = this.sprayty, self = this;
    Object.keys(sp).forEach(function (k) { sp[k].style.display = 'none'; });
    if (!this.est.dostavka) return;
    var toch = [[1.9, 6.6], [6.6, 6.6]];
    if (this.est.tamozhnya) toch.push([6.6, 1.9]);
    var dl = [], L = 0;
    for (var i = 1; i < toch.length; i++) { var d = Math.abs(toch[i][0] - toch[i - 1][0]) + Math.abs(toch[i][1] - toch[i - 1][1]); dl.push(d); L += d; }
    var v = 1.25, stop = 1.1, T = 2 * (L / v + stop), f = t % T, s, vpered = true;
    if (f < stop) s = 0;
    else if (f < stop + L / v) s = (f - stop) * v;
    else if (f < 2 * stop + L / v) s = L;
    else { s = L - (f - 2 * stop - L / v) * v; vpered = false; }
    var seg = 0, ost = s;
    while (seg < dl.length - 1 && ost > dl[seg]) { ost -= dl[seg]; seg++; }
    var a = toch[seg], b = toch[seg + 1], k = dl[seg] ? Math.min(1, ost / dl[seg]) : 0;
    var x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k;
    var imya = seg === 0 ? (vpered ? 'ax' : 'axn') : (vpered ? 'by' : 'byp');
    var p = P(x, y, 0), o = P(0, 0, 0);
    sp[imya].style.display = '';
    sp[imya].setAttribute('transform', 'translate(' + (p[0] - o[0]).toFixed(1) + ',' + (p[1] - o[1]).toFixed(1) + ')');
    void self;
  };

  /* ---------- финал: туча накрывает мир ---------- */
  Scena.prototype.final = function (nadpis, pechatSrc) {
    var self = this;
    this.finalT = true;
    this.podpG.innerHTML = '';
    this.kanalG.innerHTML = '';
    var n = this.nadpis;
    n.innerHTML = '';
    txt(n, 400, 214, nadpis || 'Всё под одной тучей', { fill: '#FFFFFF', 'font-size': 32, 'font-weight': 800 });
    var p = el('g', { 'class': 'pechat-g' }, n);
    el('circle', { cx: 400, cy: 316, r: 62, fill: '#FFFFFF' }, p);
    if (pechatSrc) el('image', { href: pechatSrc, x: 342, y: 253, width: 116, height: 126 }, p);
    txt(p, 400, 314, 'МИР', { fill: '#1E3A5F', 'font-size': 15, 'font-weight': 800, 'letter-spacing': '.08em' });
    txt(p, 400, 330, 'СОХРАНЁН', { fill: '#EF7F1A', 'font-size': 10.5, 'font-weight': 800, 'letter-spacing': '.06em' });
    function tuchaNa(s) { self.tuchaG.setAttribute('transform', 'translate(0,' + (190 * s).toFixed(1) + ') translate(400,118) scale(' + (1 + 3.6 * s).toFixed(3) + ') translate(-400,-118)'); }
    if (tixo()) { tuchaNa(1); n.setAttribute('opacity', 1); return Promise.resolve(); }
    return tween(1200, EASE.oba, tuchaNa).then(function () {
      n.setAttribute('opacity', 1);
      return tween(520, EASE.pruzhina, function (t) { masshtab(p, 400, 316, 2.2 - 1.2 * t); });
    }).then(function () { self.iskry(400, 300); return pauza(500); });
  };

  /* иконка здания для панели блоков */
  function ikonka(svg, k) {
    svg.innerHTML = '';
    var id = 'ik-' + k + (++schet);
    I.defs(svg, id);
    var g = el('g', {}, svg);
    I.RIS[k](g, 1, { anim: [], id: id, est: {} });
    try {
      var b = g.getBBox();
      svg.setAttribute('viewBox', [b.x - 3, b.y - 3, b.width + 6, b.height + 6].map(function (v) { return v.toFixed(1); }).join(' '));
    } catch (e) {}
  }

  window.TuchaScena = {
    BLOKI: BLOKI, PORYADOK: PORYADOK, PERS: PERS, KANAL: KANAL, SBORKA: SBORKA, ikonka: ikonka,
    sozdat: function (svg, opts) { return new Scena(svg, opts); }
  };
})();
