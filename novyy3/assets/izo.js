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
