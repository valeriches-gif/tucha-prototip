/* Изометрия «Мира Тучи»: геометрия и рисунки зданий.
   Остров 7×7 плиток, плитка 72×36. Склад стоит в центре, на нём
   Мастерская (спереди слева) и Витрина (сзади справа, лицом вправо).
   Телепорт — площадка слева, Портал — арка справа, дорога по переднему краю.
   Каждое здание рисуется функцией (группа, t, ctx): t — доля высоты
   (для анимации роста), ctx.anim — куда складывать живые детали. */
window.TuchaIzo = (function () {
  var NS = 'http://www.w3.org/2000/svg';
  var SHRIFT = "'Golos Text', 'Segoe UI', sans-serif";
  var TW = 72, TH = 36, N = 7, OX = 400, OY = 236;
  var H1 = 58, H2 = 44, H3 = 30;

  var C = {
    sklad: { top: '#4A7FC0', px: '#1D3E6B', py: '#2A5693' },
    mast: { top: '#9BDDFF', px: '#1A86C9', py: '#3AA7EA' },
    lavka: { top: '#FFC98F', px: '#E0700F', py: '#FF8A1F' },
    vitr: { top: '#FFF4E6', px: '#F2A95C', py: '#FFC88C' },
    kraft: { top: '#F2D2A6', px: '#C4935E', py: '#DDB07C' },
    stolb: { top: '#4F85C4', px: '#1D3E6B', py: '#2A5693' },
    bel: { top: '#FFFFFF', px: '#C8DAEC', py: '#E6F0FA' },
    ora: { top: '#FFC079', px: '#E0700F', py: '#FF8A1F' }
  };

  /* где стоит блок и где его подпись */
  var GEO = {
    hranenie: { x: 2, y: 2, w: 3, d: 3, z: 0, h: H1, pod: [400, 402, 'middle'] },
    obrabotka: { x: 2, y: 3.5, w: 3, d: 1.5, z: H1, h: H2, pod: [282, 288, 'end'] },
    lavka: { x: 2, y: 2, w: 3, d: 1.5, z: H1, h: H2, pod: [518, 288, 'start'] },
    vitrina: { x: 2.9, y: 2, w: 2, d: 1.5, z: H1, h: 40, pod: [443, 238, 'middle'] },
    dostavka: { x: 0.3, y: 4.55, w: 1.7, d: 1.7, z: 0, h: 10, pod: [247, 394, 'middle'] },
    tamozhnya: { x: 4.84, y: 0.35, w: 0.64, d: 1.5, z: 0, h: 70, pod: [546, 250, 'middle'] }
  };

  function el(n, a, p) {
    var e = document.createElementNS(NS, n);
    for (var k in a) e.setAttribute(k, a[k]);
    if (p) p.appendChild(e);
    return e;
  }
  function txt(p, x, y, s, a) {
    var t = el('text', Object.assign({ x: x, y: y, 'text-anchor': 'middle', 'font-family': SHRIFT }, a || {}), p);
    t.textContent = s;
    return t;
  }
  function P(gx, gy, z) { return [OX + (gx - gy) * TW / 2, OY + (gx + gy) * TH / 2 - (z || 0)]; }
  function pts(a) { return a.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }
  function poly(g, a, fill, dop) { return el('polygon', Object.assign({ points: pts(a), fill: fill }, dop || {}), g); }
  /* мультяшный контур, как в казуальных играх */
  var KONTUR = { stroke: '#1B3A63', 'stroke-width': 1.1, 'stroke-opacity': .8, 'stroke-linejoin': 'round' };
  function boks(g, x, y, w, d, z, h, c, dop) {
    dop = Object.assign({}, KONTUR, dop || {});
    var A = P(x, y, z + h), B = P(x + w, y, z + h), Cc = P(x + w, y + d, z + h), D = P(x, y + d, z + h);
    var B0 = P(x + w, y, z), C0 = P(x + w, y + d, z), D0 = P(x, y + d, z);
    if (c.py) poly(g, [D, Cc, C0, D0], c.py, dop);
    if (c.px) poly(g, [B, Cc, C0, B0], c.px, dop);
    if (c.top) poly(g, [A, B, Cc, D], c.top, dop);
  }
  /* грани в своих координатах: x — пиксели вдоль грани, y — вниз от верха */
  function granY(g, x, y, w, d, z, h) { var o = P(x, y + d, z + h); return el('g', { transform: 'matrix(1,0.5,0,1,' + o[0].toFixed(1) + ',' + o[1].toFixed(1) + ')' }, g); }
  function granX(g, x, y, w, d, z, h) { var o = P(x + w, y + d, z + h); return el('g', { transform: 'matrix(1,-0.5,0,1,' + o[0].toFixed(1) + ',' + o[1].toFixed(1) + ')' }, g); }

  function defs(svg, id) {
    var d = el('defs', {}, svg);
    var r = el('radialGradient', { id: id + '-p' }, d);
    el('stop', { offset: '0', 'stop-color': '#FFFFFF' }, r);
    el('stop', { offset: '.55', 'stop-color': '#9FD8F7' }, r);
    el('stop', { offset: '1', 'stop-color': '#1E90D2' }, r);
    var l = el('linearGradient', { id: id + '-l', x1: 0, y1: 1, x2: 0, y2: 0 }, d);
    el('stop', { offset: '0', 'stop-color': '#5AAEE0', 'stop-opacity': '.75' }, l);
    el('stop', { offset: '1', 'stop-color': '#5AAEE0', 'stop-opacity': '0' }, l);
    var n = el('linearGradient', { id: id + '-n', x1: 0, y1: 0, x2: 0, y2: 1 }, d);
    el('stop', { offset: '0', 'stop-color': '#FFFFFF', 'stop-opacity': '.9' }, n);
    el('stop', { offset: '1', 'stop-color': '#FFFFFF', 'stop-opacity': '0' }, n);
  }

  /* ---------- остров, дорога, мелочи ---------- */
  function ostrov(g) {
    boks(g, 1.7, 1.7, N - 3.4, N - 3.4, -100, 24, { px: '#2C5285', py: '#3A68A3' });
    boks(g, 0.7, 0.7, N - 1.4, N - 1.4, -76, 42, { px: '#3E6FAD', py: '#5288C9' });
    boks(g, 0, 0, N, N, -34, 34, { top: '#F4FAFF', px: '#6C9FD6', py: '#92C0EC' });
    for (var gx = 0; gx < N; gx++) {
      for (var gy = 0; gy < N; gy++) {
        if (gx >= 6 || gy >= 6) continue;
        poly(g, [P(gx, gy), P(gx + 1, gy), P(gx + 1, gy + 1), P(gx, gy + 1)], (gx + gy) % 2 ? '#E2F1FD' : '#F7FCFF',
          { stroke: '#C9E2F7', 'stroke-width': .8 });
      }
    }
  }
  function doroga(g) {
    poly(g, [P(0, 6.2), P(7, 6.2), P(7, 7), P(0, 7)], '#C9D6E3');
    poly(g, [P(6.2, 0), P(7, 0), P(7, 6.2), P(6.2, 6.2)], '#C9D6E3');
    poly(g, [P(0, 6), P(6, 6), P(6, 6.2), P(0, 6.2)], '#B6C7D8');
    poly(g, [P(6, 0), P(6.2, 0), P(6.2, 6.2), P(6, 6)], '#B6C7D8');
    var a = P(0.2, 6.6), b = P(6.6, 6.6), c = P(6.6, 0.2);
    el('polyline', { points: pts([a, b, c]), fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2, 'stroke-dasharray': '8 8' }, g);
  }
  function yaschik(g, x, y, z, s) {
    s = s || 0.66;
    boks(g, x - s / 2, y - s / 2, s, s, z, 24 * s / 0.66, C.kraft);
    var L = granY(g, x - s / 2, y - s / 2, s, s, z, 24 * s / 0.66);
    el('rect', { x: s * 36 / 2 - 2, y: 0, width: 4, height: 24 * s / 0.66, fill: '#C4966A' }, L);
  }
  function dekor(g, ctx) {
    [[0.6, 0.6], [1.3, 0.55], [0.6, 1.3]].forEach(function (p, i) {
      yaschik(g, p[0], p[1], 0, 0.5);
      if (i === 0) yaschik(g, p[0], p[1], 18, 0.5);
    });
    [[5.7, 3.3], [5.7, 3.9]].forEach(function (p) { yaschik(g, p[0], p[1], 0, 0.46); });
    [[6.05, 2.4], [2.6, 6.05]].forEach(function (p) {
      var b = P(p[0], p[1]);
      el('line', { x1: b[0], y1: b[1], x2: b[0], y2: b[1] - 34, stroke: '#1E3A5F', 'stroke-width': 2.4 }, g);
      el('line', { x1: b[0], y1: b[1] - 34, x2: b[0] + 8, y2: b[1] - 37, stroke: '#1E3A5F', 'stroke-width': 2.4 }, g);
      var f = el('circle', { cx: b[0] + 9, cy: b[1] - 34, r: 3.4, fill: '#FFB36B' }, g);
      if (ctx) ctx.anim.push({ tip: 'fonar', el: f, faza: p[0] });
    });
  }
  function tucha(g) {
    var kr = [[300, 132, 24], [342, 114, 34], [400, 92, 48], [460, 106, 40], [504, 128, 26]];
    /* сначала толстый контур всех частей, поверх заливка: остаётся только внешний контур */
    kr.forEach(function (c) { el('circle', { cx: c[0], cy: c[1], r: c[2], fill: '#1B3A63', stroke: '#1B3A63', 'stroke-width': 4.5 }, g); });
    el('rect', { x: 294, y: 120, width: 216, height: 36, rx: 18, fill: '#1B3A63', stroke: '#1B3A63', 'stroke-width': 4.5 }, g);
    [[346, 116, 34], [400, 98, 46], [458, 110, 38]].forEach(function (c) { el('circle', { cx: c[0] + 6, cy: c[1] + 8, r: c[2], fill: '#2B9BE0' }, g); });
    kr.forEach(function (c) { el('circle', { cx: c[0], cy: c[1], r: c[2], fill: '#3AA7EA' }, g); });
    el('rect', { x: 294, y: 120, width: 216, height: 36, rx: 18, fill: '#3AA7EA' }, g);
    el('path', { d: 'M300 150 Q400 164 504 150 L504 156 Q400 170 300 156 Z', fill: '#1E8BD0' }, g);
    [[388, 74, 20], [448, 92, 15], [334, 104, 12]].forEach(function (c) {
      el('path', { d: 'M' + (c[0] - c[2]) + ' ' + c[1] + ' a' + c[2] + ' ' + c[2] + ' 0 0 1 ' + 2 * c[2] + ' 0', fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': .35, 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
    });
  }

  /* ---------- здания ---------- */
  function shesternya(g, cx, cy, r) {
    for (var i = 0; i < 8; i++) el('rect', { x: cx - 2.6, y: cy - r - 3, width: 5.2, height: 7, rx: 1, fill: '#FFFFFF', transform: 'rotate(' + i * 45 + ' ' + cx + ' ' + cy + ')' }, g);
    el('circle', { cx: cx, cy: cy, r: r, fill: '#FFFFFF' }, g);
    el('circle', { cx: cx, cy: cy, r: r * .42, fill: '#1E90D2' }, g);
  }
  function lesa(G, w, h) {
    for (var x = 0; x <= w + .1; x += w / 4) el('line', { x1: x, y1: 0, x2: x, y2: h, stroke: '#1E3A5F', 'stroke-opacity': .55, 'stroke-width': 1.4 }, G);
    for (var y = 11; y < h; y += 11) el('line', { x1: 0, y1: y, x2: w, y2: y, stroke: '#1E3A5F', 'stroke-opacity': .55, 'stroke-width': 1.4 }, G);
  }
  function skladRis(g, t, ctx) {
    var h = H1 * t;
    boks(g, 2, 2, 3, 3, 0, h, C.sklad);
    if (t < .92) return;
    poly(g, [P(2.14, 2.14, h), P(4.86, 2.14, h), P(4.86, 4.86, h), P(2.14, 4.86, h)], '#36659A');
    if (!ctx.est || (!ctx.est.obrabotka && !ctx.est.vitrina)) {
      boks(g, 2.6, 2.7, .5, .5, h, 8, { top: '#5E86B4', px: '#1E3A5F', py: '#2C5486' });
      boks(g, 3.6, 3.9, .5, .5, h, 8, { top: '#5E86B4', px: '#1E3A5F', py: '#2C5486' });
    }
    var L = granY(g, 2, 2, 3, 3, 0, h);
    for (var i = 0; i < 5; i++) el('rect', { x: 8 + i * 20, y: 9, width: 12, height: 6, rx: 1, fill: '#5AAEE0', 'class': 'okno' }, L);
    txt(L, 8, 35, 'ТУЧА', { 'font-size': 13, 'font-weight': 800, fill: '#FFFFFF', 'text-anchor': 'start', 'letter-spacing': '.05em' });
    el('rect', { x: 62, y: 23, width: 36, height: 35, fill: '#D6E2EE' }, L);
    for (var j = 0; j < 6; j++) el('rect', { x: 62, y: 25 + j * 5.6, width: 36, height: 1.3, fill: '#AFC2D6' }, L);
    el('rect', { x: 60, y: 20, width: 40, height: 3, fill: '#EF7F1A' }, L);
    var R = granX(g, 2, 2, 3, 3, 0, h);
    for (var k = 0; k < 4; k++) el('rect', { x: 10 + k * 25, y: 9, width: 14, height: 6, rx: 1, fill: '#5AAEE0', 'class': 'okno' }, R);
    for (var m = 0; m < 3; m++) {
      el('rect', { x: 14 + m * 30, y: 35, width: 20, height: 23, fill: '#0F2338' }, R);
      el('rect', { x: 14 + m * 30, y: 33, width: 20, height: 3, fill: '#EF7F1A' }, R);
    }
    yaschik(g, 3.95, 5.35, 0, 0.42);
    yaschik(g, 4.45, 5.4, 0, 0.42);
    yaschik(g, 3.95, 5.35, 16, 0.42);
  }
  function masterskayaRis(g, t, ctx) {
    var z = H1, h = H2 * t;
    boks(g, 2, 3.5, 3, 1.5, z, h, C.mast);
    if (t < .92) return;
    var L = granY(g, 2, 3.5, 3, 1.5, z, h);
    var sh = el('g', {}, L);
    shesternya(sh, 22, 22, 11);
    ctx.anim.push({ tip: 'koleso', el: sh, cx: 22, cy: 22 });
    txt(L, 42, 18, 'МАСТЕРСКАЯ', { 'font-size': 8.6, 'font-weight': 800, fill: '#FFFFFF', 'text-anchor': 'start', 'letter-spacing': '.06em' });
    el('rect', { x: 42, y: 31, width: 60, height: 4, rx: 2, fill: '#0F4E78' }, L);
    var lenta = el('g', {}, L);
    for (var i = 0; i < 4; i++) el('rect', { x: 44 + i * 16, y: 24, width: 8, height: 7, rx: 1, fill: '#E8C79E' }, lenta);
    ctx.anim.push({ tip: 'lenta', el: lenta });
    var R = granX(g, 2, 3.5, 3, 1.5, z, h);
    el('rect', { x: 9, y: 10, width: 36, height: 14, rx: 2, fill: '#BFE3F7' }, R);
    el('line', { x1: 27, y1: 10, x2: 27, y2: 24, stroke: '#1E90D2', 'stroke-width': 1.5 }, R);
    boks(g, 2.4, 4.1, .45, .45, z + h, 12, { top: '#E4F3FC', px: '#8EC4E4', py: '#B8DDF1' });
  }
  function lavkaRis(g, t, ctx) {
    var z = H1, h = H2 * t;
    boks(g, 2, 2, 3, 1.5, z, h, C.lavka);
    if (t < .92) return;
    /* работающая Лавка: тент, витринное окно с товаром, вывеска */
    var R = granX(g, 2, 2, 3, 1.5, z, h);
    for (var i = 0; i < 6; i++) el('rect', { x: i * 9, y: 0, width: 9, height: 8, fill: i % 2 ? '#FFFFFF' : '#D9660C' }, R);
    el('path', { d: 'M0 8 Q4.5 13 9 8 Q13.5 13 18 8 Q22.5 13 27 8 Q31.5 13 36 8 Q40.5 13 45 8 Q49.5 13 54 8', fill: '#FFFFFF', stroke: '#1B3A63', 'stroke-width': .8 }, R);
    el('rect', { x: 5, y: 17, width: 30, height: 20, rx: 2, fill: '#FFF4E6', stroke: '#1B3A63', 'stroke-width': .8 }, R);
    [['#3AA7EA', 8], ['#1E3A5F', 15], ['#6BB36B', 22], ['#FFC247', 28]].forEach(function (c) { el('rect', { x: c[1], y: 27, width: 5, height: 8, rx: 1, fill: c[0] }, R); });
    el('line', { x1: 6, y1: 35.5, x2: 34, y2: 35.5, stroke: '#C4935E', 'stroke-width': 1.4 }, R);
    el('rect', { x: 38, y: 17, width: 11, height: h - 17, rx: 1.5, fill: '#1E3A5F' }, R);
    el('circle', { cx: 46.5, cy: 17 + (h - 17) / 2, r: 1, fill: '#FFC247' }, R);
    var L = granY(g, 2, 2, 3, 1.5, z, h);
    el('rect', { x: 20, y: 12, width: 68, height: 16, rx: 4, fill: '#1E3A5F' }, L);
    txt(L, 54, 24, 'ЛАВКА', { 'font-size': 11, 'font-weight': 800, fill: '#FFFFFF', 'letter-spacing': '.12em' });
    if (ctx.est && ctx.est.vitrina) return;
    var tabl = el('g', {}, g);
    boks(tabl, 3.2, 2.5, .12, .9, z + h, 20, { top: '#FFFFFF', px: '#1E3A5F', py: '#2A5693' });
    var T2 = granX(tabl, 3.2, 2.5, .12, .9, z + h, 20);
    txt(T2, 16, 13.5, 'ОТКРЫТО', { 'font-size': 6.5, 'font-weight': 800, fill: '#FFC247', 'letter-spacing': '.06em' });
  }
  function vitrinaRis(g, t, ctx) {
    var z = H1, h = 40 * t;
    boks(g, 2.9, 2, 2, 1.5, z, h, { top: '#FFFFFF', px: '#9FD8F7', py: '#CDEBFB' }, { 'fill-opacity': .92 });
    if (t < .92) return;
    /* Витрина: стеклянный павильон на складе, товар на полках, звезда «первая полка».
       Стоит сзади справа, поэтому главное лицо правое: левое закрывает Мастерская */
    var L = granY(g, 2.9, 2, 2, 1.5, z, h);
    el('rect', { x: 3, y: 3, width: 66, height: 3, rx: 1.5, fill: '#FFF4B8' }, L);
    for (var i = 0; i < 5; i++) el('rect', { x: 7 + i * 12.5, y: 14, width: 8, height: 11, rx: 1.5, fill: ['#FF8A1F', '#1E3A5F', '#3AA7EA', '#6BB36B', '#B58CC9'][i] }, L);
    el('line', { x1: 3, y1: 25.5, x2: 69, y2: 25.5, stroke: '#1B3A63', 'stroke-width': 1.2 }, L);
    el('line', { x1: 52, y1: 5, x2: 64, y2: 13, stroke: '#FFFFFF', 'stroke-width': 2.2, 'stroke-opacity': .9 }, L);
    var R = granX(g, 2.9, 2, 2, 1.5, z, h);
    el('rect', { x: 3, y: 3, width: 32, height: 11, rx: 3, fill: '#FF8A1F' }, R);
    txt(R, 19, 11, 'ВИТРИНА', { 'font-size': 6.8, 'font-weight': 800, fill: '#FFFFFF', 'letter-spacing': '.05em' });
    for (var j = 0; j < 4; j++) el('rect', { x: 5 + j * 12, y: 20, width: 8, height: 13, rx: 1.5, fill: ['#3AA7EA', '#FF8A1F', '#6BB36B', '#1E3A5F'][j] }, R);
    el('line', { x1: 3, y1: 33.5, x2: 51, y2: 33.5, stroke: '#1B3A63', 'stroke-width': 1.2 }, R);
    var v = P(4.9, 2, z + h), zv = el('g', { transform: 'translate(' + v[0].toFixed(1) + ',' + (v[1] - 10).toFixed(1) + ')' }, g);
    el('path', { d: 'M0 -9 L2.6 -2.8 L9 -2.6 L4 1.6 L5.6 8 L0 4.4 L-5.6 8 L-4 1.6 L-9 -2.6 L-2.6 -2.8 Z', fill: '#FFC247', stroke: '#1B3A63', 'stroke-width': 1 }, zv);
    if (ctx) ctx.anim.push({ tip: 'zvezda', el: zv, x: v[0], y: v[1] - 10 });
  }
  function teleportRis(g, t, ctx) {
    var c = P(1.15, 5.4, 0), rx = 0.85 * TW / 1.414, ry = rx / 2, s = Math.max(.01, t);
    var gr = el('g', { transform: 'translate(' + c[0] + ',' + c[1] + ') scale(' + s + ') translate(' + -c[0] + ',' + -c[1] + ')' }, g);
    el('ellipse', { cx: c[0], cy: c[1], rx: rx, ry: ry, fill: '#2C5486' }, gr);
    el('rect', { x: c[0] - rx, y: c[1] - 10, width: 2 * rx, height: 10, fill: '#2C5486' }, gr);
    el('ellipse', { cx: c[0], cy: c[1] - 10, rx: rx, ry: ry, fill: '#5AAEE0' }, gr);
    el('ellipse', { cx: c[0], cy: c[1] - 10, rx: rx * .7, ry: ry * .7, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2.2 }, gr);
    if (t < .92) return;
    var luch = el('path', { d: 'M' + (c[0] - rx * .7) + ' ' + (c[1] - 10) + ' L' + (c[0] - rx * .5) + ' ' + (c[1] - 80) + ' L' + (c[0] + rx * .5) + ' ' + (c[1] - 80) + ' L' + (c[0] + rx * .7) + ' ' + (c[1] - 10) + ' Z', fill: 'url(#' + ctx.id + '-l)' }, gr);
    ctx.anim.push({ tip: 'luch', el: luch });
    [0, .5].forEach(function (f) {
      var v = el('ellipse', { cx: c[0], cy: c[1] - 10, rx: rx * .7, ry: ry * .7, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.6 }, gr);
      ctx.anim.push({ tip: 'volna', el: v, cx: c[0], cy: c[1] - 10, faza: f });
    });
    txt(gr, c[0], c[1] - 6.5, '→', { 'font-size': 11, 'font-weight': 800, fill: '#1E3A5F' });
  }
  function portalRis(g, t, ctx) {
    var h = 70 * t;
    boks(g, 4.84, 0.35, .32, .32, 0, h, C.stolb);
    if (t >= .92) {
      var F = granX(g, 4.84, 0.67, .32, .86, 0, h);
      el('ellipse', { cx: 15.5, cy: 38, rx: 14, ry: 30, fill: 'url(#' + ctx.id + '-p)' }, F);
      var kol = el('ellipse', { cx: 15.5, cy: 38, rx: 12, ry: 27, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2, 'stroke-dasharray': '6 5' }, F);
      ctx.anim.push({ tip: 'portal', el: kol, cx: 15.5, cy: 38 });
    }
    boks(g, 4.84, 1.53, .32, .32, 0, h, C.stolb);
    boks(g, 4.84, 0.35, .32, 1.5, h, 12 * t, { top: '#4C7BB0', px: '#1E3A5F', py: '#2C5486' });
    if (t >= .92) {
      var B = granX(g, 4.84, 0.35, .32, 1.5, h, 12);
      txt(B, 27, 9, 'ПОРТАЛ', { 'font-size': 7.5, 'font-weight': 800, fill: '#FFFFFF', 'letter-spacing': '.1em' });
    }
  }
  var RIS = { hranenie: skladRis, obrabotka: masterskayaRis, lavka: lavkaRis, vitrina: vitrinaRis, dostavka: teleportRis, tamozhnya: portalRis };

  function gruzovik(g, os, napr) {
    var L = 1.05, W = .44, c = .32, ch;
    el('ellipse', { cx: P(0, 0)[0], cy: P(0, 0)[1] + 2, rx: 30, ry: 12, fill: 'rgba(30,58,95,.18)' }, g);
    if (os === 'x') {
      var pr = [-L / 2 + (napr > 0 ? 0 : c), -W / 2, L - c, W, 4, 19, C.bel], kb = [napr > 0 ? L / 2 - c : -L / 2, -W / 2, c, W, 4, 14, C.ora];
      ch = napr > 0 ? [pr, kb] : [kb, pr];
    } else {
      var pr2 = [-W / 2, napr < 0 ? -L / 2 + c : -L / 2, W, L - c, 4, 19, C.bel], kb2 = [-W / 2, napr < 0 ? -L / 2 : L / 2 - c, W, c, 4, 14, C.ora];
      ch = napr < 0 ? [kb2, pr2] : [pr2, kb2];
    }
    ch.forEach(function (p) { boks(g, p[0], p[1], p[2], p[3], p[4], p[5], p[6]); });
  }

  return { NS: NS, SHRIFT: SHRIFT, TW: TW, TH: TH, N: N, OX: OX, OY: OY, H1: H1, H2: H2, H3: H3, C: C, GEO: GEO,
    el: el, txt: txt, P: P, pts: pts, poly: poly, boks: boks, granX: granX, granY: granY, defs: defs,
    ostrov: ostrov, doroga: doroga, dekor: dekor, tucha: tucha, yaschik: yaschik, gruzovik: gruzovik, RIS: RIS };
})();

/* Постройка «Мира Тучи» для современной версии: те же места и анимации, что в izo.js,
   но из материалов склада и со светом, чтобы мир стоял рядом с Проводником с артов.
   Без мультяшного контура: грани отличаются светом, низ граней в тени, кромки с бликом.
   Бетонная площадка с разметкой, профлист и доки со светом внутри, стеклянная Мастерская,
   Лавка с тентом, стеклянная Витрина, стальные Телепорт и Портал с тонкими линиями энергии,
   объёмная туча. Подключается сразу после izo.js (сборщик дописывает этот файл в izo.js),
   поэтому scena.js берёт уже эти boks и цвета. */
(function (I) {
  var el = I.el, txt = I.txt, P = I.P, pts = I.pts, TW = I.TW, N = I.N, H1 = I.H1, H2 = I.H2, H3 = I.H3;
  var SK = "'Sklad', 'Golos Text', sans-serif";
  var ENERG = '#7FD8FF', BALKA = '#F07F1A', CHERN = '#16202E', SVET = '#FFC46E';

  var C = {
    sklad: { top: '#3A4450', px: '#1F4675', py: '#2E5C92' },
    mast: { top: '#56616D', px: '#7F97AD', py: '#9DB4C8' },
    lavka: { top: '#5A4A3F', px: '#B9601A', py: '#E07B26' },
    vitr: { top: '#EAF4FB', px: '#8FB7D3', py: '#B7D5E8' },
    kraft: { top: '#E3C298', px: '#B8864F', py: '#D2A673' },
    stolb: { top: '#8793A0', px: '#46515D', py: '#5B6878' },
    bel: { top: '#F7F9FB', px: '#C4CED8', py: '#E2E8EE' },
    ora: { top: '#FFA24F', px: '#C45E0A', py: '#F07F1A' }
  };

  function poly(g, a, fill, dop) { return el('polygon', Object.assign({ points: pts(a), fill: fill }, dop || {}), g); }
  function mezh(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; }

  /* коробка со светом: верх светлый, низ боковых граней в тени, передние кромки с бликом */
  function boks(g, x, y, w, d, z, h, c, dop) {
    dop = dop || {};
    var steklo = dop['fill-opacity'] !== undefined;
    var A = P(x, y, z + h), B = P(x + w, y, z + h), Cc = P(x + w, y + d, z + h), D = P(x, y + d, z + h);
    var B0 = P(x + w, y, z), C0 = P(x + w, y + d, z), D0 = P(x, y + d, z);
    if (c.py) {
      poly(g, [D, Cc, C0, D0], c.py, dop);
      if (h > 6 && !steklo) poly(g, [mezh(D, D0, .55), mezh(Cc, C0, .55), C0, D0], '#000', { 'fill-opacity': .12 });
    }
    if (c.px) {
      poly(g, [B, Cc, C0, B0], c.px, dop);
      if (h > 6 && !steklo) poly(g, [mezh(B, B0, .55), mezh(Cc, C0, .55), C0, B0], '#000', { 'fill-opacity': .12 });
    }
    if (c.top) {
      poly(g, [A, B, Cc, D], c.top, dop);
      el('polyline', { points: pts([D, Cc, B]), fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': .3, 'stroke-width': .9, 'stroke-linejoin': 'round' }, g);
    }
    if (c.py && c.px && h > 3) el('line', { x1: Cc[0], y1: Cc[1], x2: C0[0], y2: C0[1], stroke: '#FFFFFF', 'stroke-opacity': .18, 'stroke-width': .9 }, g);
  }
  var granY = I.granY, granX = I.granX;

  function defs(svg, id) {
    var d = el('defs', {}, svg);
    var r = el('radialGradient', { id: id + '-p' }, d);
    el('stop', { offset: '0', 'stop-color': '#2A3A52' }, r);
    el('stop', { offset: '1', 'stop-color': CHERN }, r);
    var l = el('linearGradient', { id: id + '-l', x1: 0, y1: 1, x2: 0, y2: 0 }, d);
    el('stop', { offset: '0', 'stop-color': ENERG, 'stop-opacity': '.32' }, l);
    el('stop', { offset: '1', 'stop-color': ENERG, 'stop-opacity': '0' }, l);
    var n = el('linearGradient', { id: id + '-n', x1: 0, y1: 0, x2: 0, y2: 1 }, d);
    el('stop', { offset: '0', 'stop-color': '#FFFFFF', 'stop-opacity': '.9' }, n);
    el('stop', { offset: '1', 'stop-color': '#FFFFFF', 'stop-opacity': '0' }, n);
  }

  function profnastil(G, w, h) {
    for (var x = 3; x < w; x += 4) el('rect', { x: x, y: 0, width: 1, height: h, fill: '#FFFFFF', 'fill-opacity': .07 }, G);
  }
  function vorota(G, x, y, w, h) {
    el('rect', { x: x - 2, y: y - 2, width: w + 4, height: h + 2, fill: '#141B23' }, G);
    el('rect', { x: x, y: y, width: w, height: h, fill: '#C3CCD5' }, G);
    for (var i = 3; i < h; i += 3.4) el('rect', { x: x, y: y + i, width: w, height: .8, fill: '#9AA6B2' }, G);
  }

  /* ---------- площадка, дорога, мелочи ---------- */
  function ostrov(g) {
    boks(g, 1.6, 1.6, N - 3.2, N - 3.2, -104, 26, { px: '#1C232B', py: '#252D36' });
    boks(g, 0.6, 0.6, N - 1.2, N - 1.2, -78, 44, { px: '#2B343E', py: '#36404B' });
    boks(g, 0, 0, N, N, -30, 30, { top: '#C5CCD2', px: '#56606B', py: '#6B7682' });
    /* сигнальная полоса по верхней кромке площадки */
    [granY(g, 0, 0, N, N, -30, 30), granX(g, 0, 0, N, N, -30, 30)].forEach(function (G) {
      for (var i = 0; i < 21; i++) el('polygon', { points: (i * 12) + ',0 ' + (i * 12 + 6) + ',0 ' + (i * 12 + 3) + ',5 ' + (i * 12 - 3) + ',5', fill: i % 2 ? CHERN : '#F0A31A' }, G);
    });
    for (var gx = 0; gx < N; gx++) {
      for (var gy = 0; gy < N; gy++) {
        if (gx >= 6 || gy >= 6) continue;
        poly(g, [P(gx, gy), P(gx + 1, gy), P(gx + 1, gy + 1), P(gx, gy + 1)], (gx * 3 + gy) % 4 ? '#C8CFD5' : '#C0C7CE',
          { stroke: '#AEB6BE', 'stroke-width': .7 });
      }
    }
    /* разметка зон хранения у паллет */
    [[0.12, 0.12, 1.95, 1.95], [5.2, 2.95, 5.98, 4.3]].forEach(function (z) {
      el('polygon', { points: pts([P(z[0], z[1]), P(z[2], z[1]), P(z[2], z[3]), P(z[0], z[3])]), fill: 'none', stroke: '#E9A21B', 'stroke-width': 1.6 }, g);
    });
  }
  function doroga(g) {
    poly(g, [P(0, 6.2), P(7, 6.2), P(7, 7), P(0, 7)], '#4A525C');
    poly(g, [P(6.2, 0), P(7, 0), P(7, 6.2), P(6.2, 6.2)], '#4A525C');
    poly(g, [P(0, 6), P(6, 6), P(6, 6.2), P(0, 6.2)], '#8A939C');
    poly(g, [P(6, 0), P(6.2, 0), P(6.2, 6.2), P(6, 6)], '#8A939C');
    var a = P(0.2, 6.6), b = P(6.6, 6.6), c = P(6.6, 0.2);
    el('polyline', { points: pts([a, b, c]), fill: 'none', stroke: '#F2F4F6', 'stroke-opacity': .85, 'stroke-width': 1.8, 'stroke-dasharray': '9 9' }, g);
  }
  function yaschik(g, x, y, z, s) {
    s = s || 0.66;
    var h = 24 * s / 0.66;
    boks(g, x - s / 2, y - s / 2, s, s, z, h, C.kraft);
    var L = granY(g, x - s / 2, y - s / 2, s, s, z, h), R = granX(g, x - s / 2, y - s / 2, s, s, z, h);
    el('rect', { x: s * 36 / 2 - 2, y: 0, width: 4, height: h * .45, fill: '#F1DDBE', 'fill-opacity': .75 }, L);
    el('rect', { x: s * 36 / 2 - 2, y: 0, width: 4, height: h * .45, fill: '#E6CCA4', 'fill-opacity': .6 }, R);
    poly(g, [mezh(P(x - s / 2, y, z + h), P(x + s / 2, y, z + h), 0), P(x + s / 2, y, z + h), P(x + s / 2, y + .08, z + h), P(x - s / 2, y + .08, z + h)], '#F1DDBE', { 'fill-opacity': .7 });
  }
  function paleta(g, x, y, z, s) {
    boks(g, x - s / 2 - .05, y - s / 2 - .05, s + .1, s + .1, z, 4, { top: '#B98A57', px: '#7D5A36', py: '#9A7045' });
  }
  function dekor(g, ctx) {
    [[0.6, 0.6], [1.3, 0.55], [0.6, 1.3]].forEach(function (p, i) {
      paleta(g, p[0], p[1], 0, 0.5);
      yaschik(g, p[0], p[1], 4, 0.5);
      if (i === 0) yaschik(g, p[0], p[1], 22, 0.5);
    });
    [[5.7, 3.3], [5.7, 3.9]].forEach(function (p) { paleta(g, p[0], p[1], 0, 0.46); yaschik(g, p[0], p[1], 4, 0.46); });
    [[6.05, 2.4], [2.6, 6.05]].forEach(function (p) {
      var b = P(p[0], p[1]);
      el('ellipse', { cx: b[0] + 9, cy: b[1] + 2, rx: 26, ry: 12, fill: '#FFD08A', 'fill-opacity': .16 }, g);
      el('line', { x1: b[0], y1: b[1], x2: b[0], y2: b[1] - 36, stroke: '#2A3440', 'stroke-width': 2.2 }, g);
      el('line', { x1: b[0], y1: b[1] - 36, x2: b[0] + 9, y2: b[1] - 39, stroke: '#2A3440', 'stroke-width': 2.2 }, g);
      el('rect', { x: b[0] + 5, y: b[1] - 39, width: 9, height: 3, rx: 1, fill: '#2A3440' }, g);
      var f = el('ellipse', { cx: b[0] + 9.5, cy: b[1] - 35, rx: 4, ry: 1.8, fill: '#FFE2A8' }, g);
      if (ctx) ctx.anim.push({ tip: 'fonar', el: f, faza: p[0] });
    });
  }
  /* объёмная туча, как облако над головой Проводника: тень снизу, свет сверху, без контура */
  /* много мелких клубов в четыре тона: снизу холодная тень, сверху белый свет, контура нет */
  var KLUBY = [[304, 138, 20], [326, 124, 24], [352, 112, 28], [380, 98, 32], [410, 90, 34], [440, 98, 30], [468, 110, 27], [492, 124, 22], [512, 138, 16],
    [340, 142, 22], [376, 138, 26], [414, 136, 28], [452, 138, 26], [488, 142, 20], [396, 74, 22], [428, 70, 20], [366, 86, 18], [456, 84, 17]];
  function tucha(g) {
    KLUBY.forEach(function (c) { el('circle', { cx: c[0] + 1, cy: c[1] + 6, r: c[2], fill: '#A3B5C6' }, g); });
    KLUBY.forEach(function (c) { el('circle', { cx: c[0], cy: c[1] + 2, r: c[2], fill: '#C6D3DE' }, g); });
    KLUBY.forEach(function (c) { el('circle', { cx: c[0] - c[2] * .12, cy: c[1] - c[2] * .12, r: c[2] * .86, fill: '#DCE5ED' }, g); });
    KLUBY.forEach(function (c) { if (c[1] < 128) el('circle', { cx: c[0] - c[2] * .22, cy: c[1] - c[2] * .3, r: c[2] * .58, fill: '#F6F9FB' }, g); });
    KLUBY.forEach(function (c) { if (c[1] < 100) el('circle', { cx: c[0] - c[2] * .28, cy: c[1] - c[2] * .4, r: c[2] * .32, fill: '#FFFFFF' }, g); });
  }

  /* ---------- здания ---------- */
  function skladRis(g, t, ctx) {
    var h = H1 * t;
    boks(g, 2, 2, 3, 3, 0, h, C.sklad);
    if (t < .92) return;
    poly(g, [P(2.12, 2.12, h), P(4.88, 2.12, h), P(4.88, 4.88, h), P(2.12, 4.88, h)], '#46515D');
    if (!ctx.est || (!ctx.est.obrabotka && !ctx.est.vitrina)) {
      [2.5, 3.3, 4.1].forEach(function (x0) {
        poly(g, [P(x0, 2.45, h), P(x0 + .38, 2.45, h), P(x0 + .38, 4.55, h), P(x0, 4.55, h)], '#7FA6C6');
        el('line', { x1: P(x0, 4.55, h)[0], y1: P(x0, 4.55, h)[1], x2: P(x0 + .38, 4.55, h)[0], y2: P(x0 + .38, 4.55, h)[1], stroke: '#FFFFFF', 'stroke-opacity': .5, 'stroke-width': 1 }, g);
      });
    }
    var L = granY(g, 2, 2, 3, 3, 0, h);
    profnastil(L, 108, h);
    for (var i = 0; i < 5; i++) el('rect', { x: 8 + i * 20, y: 6, width: 13, height: 5, fill: SVET, 'fill-opacity': .9, 'class': 'okno' }, L);
    el('rect', { x: 6, y: 18, width: 46, height: 15, fill: CHERN }, L);
    txt(L, 29, 29.5, 'ТУЧА', { 'font-family': SK, 'font-size': 13, 'font-weight': 900, fill: '#FFFFFF', 'letter-spacing': '.08em' });
    el('rect', { x: 6, y: 33, width: 46, height: 2, fill: BALKA }, L);
    vorota(L, 64, 24, 34, 34);
    el('rect', { x: 60, y: 19, width: 42, height: 3, fill: BALKA }, L);
    var R = granX(g, 2, 2, 3, 3, 0, h);
    profnastil(R, 108, h);
    for (var k = 0; k < 4; k++) el('rect', { x: 10 + k * 25, y: 6, width: 14, height: 5, fill: SVET, 'fill-opacity': .9, 'class': 'okno' }, R);
    for (var m = 0; m < 3; m++) {
      var x = 12 + m * 31;
      el('rect', { x: x, y: 27, width: 24, height: 31, fill: '#141B23' }, R);
      el('rect', { x: x + 2, y: 29, width: 20, height: 11, fill: '#C3CCD5' }, R);
      el('rect', { x: x + 2, y: 40, width: 20, height: 18, fill: SVET, 'fill-opacity': .85 }, R);
      el('rect', { x: x + 1, y: 53, width: 3, height: 5, fill: BALKA }, R);
      el('rect', { x: x + 20, y: 53, width: 3, height: 5, fill: BALKA }, R);
      el('rect', { x: x + 8, y: 23, width: 8, height: 2, fill: '#FFE3A8' }, R);
    }
    paleta(g, 3.95, 5.35, 0, 0.42); yaschik(g, 3.95, 5.35, 4, 0.42);
    paleta(g, 4.45, 5.4, 0, 0.42); yaschik(g, 4.45, 5.4, 4, 0.42);
    yaschik(g, 3.95, 5.35, 20, 0.42);
  }
  function masterskayaRis(g, t, ctx) {
    var z = H1, h = H2 * t;
    boks(g, 2, 3.5, 3, 1.5, z, h, C.mast);
    if (t < .92) return;
    var L = granY(g, 2, 3.5, 3, 1.5, z, h);
    el('rect', { x: 4, y: 4, width: 100, height: 36, fill: '#35577A' }, L);
    el('rect', { x: 4, y: 22, width: 100, height: 18, fill: SVET, 'fill-opacity': .3 }, L);
    el('polygon', { points: '14,4 30,4 12,40 4,40 4,24', fill: '#FFFFFF', 'fill-opacity': .1 }, L);
    for (var x = 4; x <= 104; x += 25) el('rect', { x: x - .8, y: 4, width: 1.6, height: 36, fill: '#D9E1E8' }, L);
    el('rect', { x: 4, y: 20.5, width: 100, height: 1.4, fill: '#D9E1E8' }, L);
    /* вытяжка вращается */
    el('circle', { cx: 22, cy: 22, r: 10.5, fill: '#D9E1E8' }, L);
    el('circle', { cx: 22, cy: 22, r: 9, fill: '#2A3440' }, L);
    var sh = el('g', {}, L);
    for (var i = 0; i < 4; i++) el('path', { d: 'M22 22 L20 13.5 Q22 12.6 24 13.5 Z', fill: '#C9D2DB', transform: 'rotate(' + i * 90 + ' 22 22)' }, sh);
    el('circle', { cx: 22, cy: 22, r: 2, fill: '#8793A0' }, sh);
    ctx.anim.push({ tip: 'koleso', el: sh, cx: 22, cy: 22 });
    el('rect', { x: 40, y: 7, width: 62, height: 11, fill: CHERN }, L);
    txt(L, 71, 15.6, 'МАСТЕРСКАЯ', { 'font-family': SK, 'font-size': 8.4, 'font-weight': 900, fill: '#FFFFFF', 'letter-spacing': '.06em' });
    el('rect', { x: 42, y: 31, width: 60, height: 4, fill: '#1C242D' }, L);
    var lenta = el('g', {}, L);
    for (var j = 0; j < 4; j++) el('rect', { x: 44 + j * 16, y: 24, width: 8, height: 7, fill: '#D2A673' }, lenta);
    ctx.anim.push({ tip: 'lenta', el: lenta });
    var R = granX(g, 2, 3.5, 3, 1.5, z, h);
    el('rect', { x: 6, y: 7, width: 42, height: 16, fill: '#35577A' }, R);
    el('rect', { x: 26.2, y: 7, width: 1.6, height: 16, fill: '#D9E1E8' }, R);
    vorota(R, 16, 28, 22, 16);
    boks(g, 2.4, 4.1, .45, .45, z + h, 10, { top: '#AEB8C2', px: '#6E7883', py: '#8A949E' });
  }
  function lavkaRis(g, t, ctx) {
    var z = H1, h = H2 * t;
    boks(g, 2, 2, 3, 1.5, z, h, C.lavka);
    if (t < .92) return;
    var R = granX(g, 2, 2, 3, 1.5, z, h);
    for (var i = 0; i < 6; i++) el('rect', { x: i * 9, y: 0, width: 9, height: 9, fill: i % 2 ? '#F4EBDD' : '#D9620E' }, R);
    el('path', { d: 'M0 9 Q4.5 14 9 9 Q13.5 14 18 9 Q22.5 14 27 9 Q31.5 14 36 9 Q40.5 14 45 9 Q49.5 14 54 9', fill: '#F4EBDD' }, R);
    el('rect', { x: 0, y: 12, width: 54, height: 3, fill: '#000', 'fill-opacity': .18 }, R);
    el('rect', { x: 4, y: 16, width: 32, height: 24, fill: '#2A3440' }, R);
    el('rect', { x: 5.5, y: 17.5, width: 29, height: 21, fill: '#FFE2A6' }, R);
    [['#3F6E9E', 8], ['#2A3440', 15], ['#6E9E5E', 22], ['#D9A441', 28]].forEach(function (c) { el('rect', { x: c[1], y: 28, width: 5, height: 9, fill: c[0] }, R); });
    el('rect', { x: 5.5, y: 37, width: 29, height: 1.6, fill: '#B98A57' }, R);
    el('rect', { x: 38, y: 17, width: 12, height: h - 17, fill: '#2A3440' }, R);
    el('rect', { x: 40, y: 19, width: 8, height: 12, fill: '#FFD48A', 'fill-opacity': .75 }, R);
    var L = granY(g, 2, 2, 3, 1.5, z, h);
    el('rect', { x: 20, y: 10, width: 68, height: 16, fill: CHERN }, L);
    txt(L, 54, 22.4, 'ЛАВКА', { 'font-family': SK, 'font-size': 12.5, 'font-weight': 900, fill: '#FFFFFF', 'letter-spacing': '.14em' });
    el('rect', { x: 20, y: 26, width: 68, height: 2, fill: BALKA }, L);
    if (ctx.est && ctx.est.vitrina) return;
    var tabl = el('g', {}, g);
    boks(tabl, 3.2, 2.5, .12, .9, z + h, 20, { top: '#3A4450', px: CHERN, py: '#222B35' });
    var T2 = granX(tabl, 3.2, 2.5, .12, .9, z + h, 20);
    txt(T2, 16, 13.5, 'ОТКРЫТО', { 'font-family': SK, 'font-size': 7.5, 'font-weight': 900, fill: '#FFB547', 'letter-spacing': '.06em' });
  }
  function vitrinaRis(g, t, ctx) {
    var z = H1, h = 40 * t;
    boks(g, 2.9, 2, 2, 1.5, z, h, C.vitr, { 'fill-opacity': .88 });
    if (t < .92) return;
    var L = granY(g, 2.9, 2, 2, 1.5, z, h);
    el('rect', { x: 3, y: 3, width: 66, height: 2.5, fill: '#FFE9B0' }, L);
    for (var i = 0; i < 5; i++) el('rect', { x: 7 + i * 12.5, y: 14, width: 8, height: 11, fill: ['#D9620E', '#2A3440', '#3F6E9E', '#6E9E5E', '#D9A441'][i] }, L);
    el('rect', { x: 3, y: 25, width: 66, height: 1.4, fill: '#2A3440', 'fill-opacity': .7 }, L);
    el('line', { x1: 52, y1: 5, x2: 64, y2: 13, stroke: '#FFFFFF', 'stroke-width': 2, 'stroke-opacity': .8 }, L);
    var R = granX(g, 2.9, 2, 2, 1.5, z, h);
    el('rect', { x: 3, y: 3, width: 34, height: 11, fill: BALKA }, R);
    txt(R, 20, 11.4, 'ВИТРИНА', { 'font-family': SK, 'font-size': 7.4, 'font-weight': 900, fill: CHERN, 'letter-spacing': '.05em' });
    el('rect', { x: 3, y: 16, width: 48, height: 2, fill: '#FFE9B0' }, R);
    for (var j = 0; j < 4; j++) el('rect', { x: 5 + j * 12, y: 20, width: 8, height: 13, fill: ['#3F6E9E', '#D9620E', '#6E9E5E', '#2A3440'][j] }, R);
    el('rect', { x: 3, y: 33, width: 48, height: 1.4, fill: '#2A3440', 'fill-opacity': .7 }, R);
    var v = P(4.9, 2, z + h), zv = el('g', { transform: 'translate(' + v[0].toFixed(1) + ',' + (v[1] - 10).toFixed(1) + ')' }, g);
    el('path', { d: 'M0 -9 L2.6 -2.8 L9 -2.6 L4 1.6 L5.6 8 L0 4.4 L-5.6 8 L-4 1.6 L-9 -2.6 L-2.6 -2.8 Z', fill: '#F5B83D' }, zv);
    el('path', { d: 'M0 -9 L2.6 -2.8 L9 -2.6 L0 0 Z', fill: '#FFE08A' }, zv);
    if (ctx) ctx.anim.push({ tip: 'zvezda', el: zv, x: v[0], y: v[1] - 10 });
  }
  function teleportRis(g, t, ctx) {
    var c = P(1.15, 5.4, 0), rx = 0.85 * TW / 1.414, ry = rx / 2, s = Math.max(.01, t);
    var gr = el('g', { transform: 'translate(' + c[0] + ',' + c[1] + ') scale(' + s + ') translate(' + -c[0] + ',' + -c[1] + ')' }, g);
    el('ellipse', { cx: c[0], cy: c[1], rx: rx, ry: ry, fill: '#2B343E' }, gr);
    el('rect', { x: c[0] - rx, y: c[1] - 8, width: 2 * rx, height: 8, fill: '#2B343E' }, gr);
    el('ellipse', { cx: c[0], cy: c[1] - 8, rx: rx, ry: ry, fill: '#6B7682' }, gr);
    el('ellipse', { cx: c[0], cy: c[1] - 8, rx: rx * .9, ry: ry * .9, fill: 'none', stroke: '#F0A31A', 'stroke-width': 3, 'stroke-dasharray': '7 6' }, gr);
    el('ellipse', { cx: c[0], cy: c[1] - 8, rx: rx * .7, ry: ry * .7, fill: '#2A333D' }, gr);
    el('ellipse', { cx: c[0], cy: c[1] - 8, rx: rx * .62, ry: ry * .62, fill: 'none', stroke: ENERG, 'stroke-width': 1.4 }, gr);
    if (t < .92) return;
    var luch = el('path', { d: 'M' + (c[0] - rx * .62) + ' ' + (c[1] - 8) + ' L' + (c[0] - rx * .45) + ' ' + (c[1] - 80) + ' L' + (c[0] + rx * .45) + ' ' + (c[1] - 80) + ' L' + (c[0] + rx * .62) + ' ' + (c[1] - 8) + ' Z', fill: 'url(#' + ctx.id + '-l)' }, gr);
    ctx.anim.push({ tip: 'luch', el: luch });
    [0, .5].forEach(function (f) {
      var v = el('ellipse', { cx: c[0], cy: c[1] - 8, rx: rx * .62, ry: ry * .62, fill: 'none', stroke: ENERG, 'stroke-width': 1.2 }, gr);
      ctx.anim.push({ tip: 'volna', el: v, cx: c[0], cy: c[1] - 8, faza: f });
    });
  }
  function portalRis(g, t, ctx) {
    var h = 70 * t;
    boks(g, 4.84, 0.35, .32, .32, 0, h, C.stolb);
    if (t >= .92) {
      var F = granX(g, 4.84, 0.67, .32, .86, 0, h);
      el('ellipse', { cx: 15.5, cy: 38, rx: 14, ry: 30, fill: 'url(#' + ctx.id + '-p)' }, F);
      el('ellipse', { cx: 15.5, cy: 38, rx: 8, ry: 18, fill: 'none', stroke: ENERG, 'stroke-width': 1, 'stroke-opacity': .55 }, F);
      var kol = el('ellipse', { cx: 15.5, cy: 38, rx: 12, ry: 27, fill: 'none', stroke: ENERG, 'stroke-width': 1.4, 'stroke-dasharray': '10 6' }, F);
      ctx.anim.push({ tip: 'portal', el: kol, cx: 15.5, cy: 38 });
    }
    boks(g, 4.84, 1.53, .32, .32, 0, h, C.stolb);
    boks(g, 4.84, 0.35, .32, 1.5, h, 12 * t, { top: '#3A4450', px: '#1C242D', py: '#262F39' });
    if (t >= .92) {
      var B = granX(g, 4.84, 0.35, .32, 1.5, h, 12);
      txt(B, 27, 9, 'ПОРТАЛ', { 'font-family': SK, 'font-size': 8.4, 'font-weight': 900, fill: '#FFFFFF', 'letter-spacing': '.12em' });
      el('rect', { x: 0, y: 10.5, width: 54, height: 1.5, fill: BALKA }, B);
    }
  }

  function gruzovik(g, os, napr) {
    var L = 1.05, W = .44, c = .32, ch;
    el('ellipse', { cx: P(0, 0)[0], cy: P(0, 0)[1] + 2, rx: 30, ry: 12, fill: 'rgba(14,23,38,.28)' }, g);
    if (os === 'x') {
      var pr = [-L / 2 + (napr > 0 ? 0 : c), -W / 2, L - c, W, 4, 19, C.bel], kb = [napr > 0 ? L / 2 - c : -L / 2, -W / 2, c, W, 4, 14, C.ora];
      ch = napr > 0 ? [pr, kb] : [kb, pr];
    } else {
      var pr2 = [-W / 2, napr < 0 ? -L / 2 + c : -L / 2, W, L - c, 4, 19, C.bel], kb2 = [-W / 2, napr < 0 ? -L / 2 : L / 2 - c, W, c, 4, 14, C.ora];
      ch = napr < 0 ? [kb2, pr2] : [pr2, kb2];
    }
    ch.forEach(function (p) { boks(g, p[0], p[1], p[2], p[3], p[4], p[5], p[6]); });
  }

  Object.assign(I, {
    C: C, boks: boks, poly: poly, defs: defs, ostrov: ostrov, doroga: doroga, dekor: dekor, tucha: tucha, yaschik: yaschik, gruzovik: gruzovik,
    RIS: { hranenie: skladRis, obrabotka: masterskayaRis, lavka: lavkaRis, vitrina: vitrinaRis, dostavka: teleportRis, tamozhnya: portalRis }
  });
})(window.TuchaIzo);
