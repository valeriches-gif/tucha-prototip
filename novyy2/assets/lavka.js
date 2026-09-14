/* Лавка: каталог, товар, корзина, заказ, покупки и конструктор карточки Витрины.
   Сервера нет: корзина и заказы живут в браузере, оплата демо. Товары —
   lavka-dannye.js (собирается из src/lavka.json). Страница говорит, что
   показать, атрибутом data-lavka="katalog|tovar|korzina|zakaz|pokupki|vitrina|vitrinka". */
window.TuchaLavka = (function () {
  var T = window.Tucha, D = window.LAVKA_D || { tovary: [], kategorii: [], zachem: [] }, R = T.ROOT, API = {};
  var KK = 'tucha.korzina', KZ = 'tucha.zakazy';
  var tiho = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PO_ID = {};
  D.tovary.forEach(function (t) { PO_ID[t.id] = t; });

  /* как нарисовать упаковку: форма и надпись на ней */
  var FORMA = { 1: ['rulon'], 2: ['stopka', '50 шт'], 3: ['tarelki'], 4: ['pouch', 'ЧАЙ'], 5: ['pouch', 'КОФЕ'], 6: ['kanistra', '5 л'],
    7: ['korob'], 8: ['meshok', '15 кг'], 9: ['meshok', '10 л'], 10: ['pachka'], 11: ['kastryulya'], 12: ['stopka', 'САТИН'] };
  var OPIS = {
    1: 'Ручная стрейч-плёнка для обмотки паллет и коробов. Рулон 500 мм, 2,4 кг.',
    2: 'Вафельное полотенце 40×70 для кафе, салонов и дома. Белое, в упаковке 50 штук.',
    3: 'Стеклянная тарелка 25 см для кафе и столовых. Если при доставке что-то разбилось, заменим.',
    4: 'Чёрный листовой чай, пачка 500 г. В коробе 10 пачек.',
    5: 'Обжарено под эспрессо: плотное тело, шоколад и орех во вкусе, без кислинки.',
    6: 'Средство для мытья посуды, канистра 5 л. Для кафе, офисов и дома.',
    7: 'Бурый гофрокороб 400×300×300 мм для переезда и отправок. Продаётся пачками по 20 штук.',
    8: 'Сухой корм для собак, мешок 15 кг.',
    9: 'Древесный наполнитель, 10 л: для лотков и клеток.',
    10: 'Бумажные салфетки, упаковка из 24 пачек.',
    11: 'Кастрюля из нержавеющей стали, 5 л, с крышкой. Для дома и кафе.',
    12: 'Простыня на резинке 160×200, сатин.'
  };
  var PODBORKI = { coffee: [5, 4, 3, 10, 11, 7], cafe: [3, 11, 6, 10, 2, 5], shop: [1, 7, 6, 10, 4, 9], mp: [1, 7, 10],
    office: [4, 5, 10, 6, 7], move: [7, 1, 12, 2] };
  var CENY = [['', 'Любая'], ['p0', 'до 100 ₽'], ['p1', '100-500 ₽'], ['p2', '500-1 500 ₽'], ['p3', 'от 1 500 ₽']];
  var FORMY = { 'короб': ['короб', 'короба', 'коробов'], 'упаковка': ['упаковка', 'упаковки', 'упаковок'], 'пачка': ['пачка', 'пачки', 'пачек'],
    'паллета': ['паллета', 'паллеты', 'паллет'], 'шт': ['шт', 'шт', 'шт'] };
  var UR = { one: 'Штучно', box: 'Коробами', pal: 'Паллетами' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function rub(n) { return Math.round(n).toLocaleString('ru-RU') + ' ₽'; }
  function plural(n, f) { var a = Math.abs(n) % 100, b = a % 10; return a > 10 && a < 20 ? f[2] : b === 1 ? f[0] : b > 1 && b < 5 ? f[1] : f[2]; }
  function ed(t, u) { return u === 'one' ? 'шт' : u === 'box' ? t.boxName : 'паллета'; }
  function edN(t, u, q) { return q + ' ' + plural(q, FORMY[ed(t, u)]); }
  function N(t, u) { return u === 'one' ? 1 : u === 'box' ? t.boxN : t.palN; }
  function summa(t, u, q) { return q * N(t, u) * t[u]; }
  function vygoda(t, u) { return Math.round((1 - t[u] / t.one) * 100); }
  function reyt(x) { return String(x).replace('.', ','); }

  /* ---------- корзина: [{id, u, q}] ---------- */
  function korz() { return (T.st.get(KK) || []).filter(function (x) { return PO_ID[x.id] && x.q > 0; }); }
  function sohrKorz(k, bump) { T.st.set(KK, k); if (T.korzObnovit) T.korzObnovit(bump); }
  function dobavit(id, u, q) {
    var k = korz(), x = k.filter(function (y) { return y.id === id && y.u === u; })[0];
    if (x) x.q += q; else k.push({ id: id, u: u, q: q });
    sohrKorz(k, true);
    T.goal('lavka_v_korzinu');
  }
  function itogi(k) {
    var s = 0, m = 0;
    k.forEach(function (x) { var t = PO_ID[x.id]; s += summa(t, x.u, x.q); m += x.q * N(t, x.u) / t.palN; });
    return { sum: s, mesta: m, poz: k.length };
  }
  /* сколько места займёт: машину считаем по паллето-местам, а не по числу коробок */
  function mashina(m) {
    var mm = Math.max(.1, Math.ceil(m * 10) / 10);
    if (mm <= 6) return { imya: 'Газель', vsego: 6, zanyato: mm, dost: 1400 };
    if (mm <= 15) return { imya: 'Машина 5 т', vsego: 15, zanyato: mm, dost: 0 };
    return { imya: 'Фура', vsego: 33, zanyato: Math.min(33, mm), dost: 0 };
  }

  /* ---------- упаковка рисунком ---------- */
  function mix(h, c, k) {
    var a = parseInt(h.slice(1), 16), b = parseInt(c.slice(1), 16);
    return '#' + [16, 8, 0].map(function (s) {
      var x = (a >> s) & 255, y = (b >> s) & 255, v = Math.round(x + (y - x) * k);
      return (v < 16 ? '0' : '') + v.toString(16);
    }).join('');
  }
  var UID = 0;
  function upak(t, kl) {
    var f = t.forma || FORMA[t.id] || ['korob'], c = t.cvet, sv = mix(c, '#FFFFFF', .45), tm = mix(c, '#10243D', .35), id = 'lu' + (++UID);
    var H = 'url(#' + id + 'h)', M = 'url(#' + id + 'm)', F = 'url(#' + id + 'f)';
    var tx = function (x, y, s, fs) { return '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-size="' + (fs || 15) + '" font-weight="800" fill="' + tm + '" font-family="Rubik, Golos Text, sans-serif">' + s + '</text>'; };
    var blik = function (d) { return '<path d="' + d + '" stroke="#fff" stroke-width="5" opacity=".3" fill="none" stroke-linecap="round"/>'; };
    var d = '<defs><linearGradient id="' + id + 'h" x1="0" x2="1"><stop offset="0" stop-color="' + sv + '"/><stop offset=".5" stop-color="' + c + '"/><stop offset="1" stop-color="' + tm + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'm" x1="0" x2="1"><stop offset="0" stop-color="#F5F8FB"/><stop offset=".55" stop-color="#C9D3DE"/><stop offset="1" stop-color="#8795A6"/></linearGradient>' +
      '<linearGradient id="' + id + 'f" x1="0" x2="1"><stop offset="0" stop-color="#F7FCFF"/><stop offset=".6" stop-color="#D5EAF6"/><stop offset="1" stop-color="#A9CBE2"/></linearGradient></defs>';
    var s = '<ellipse cx="100" cy="146" rx="66" ry="8" fill="#16304F" opacity=".14"/>', b = '';
    if (f[0] === 'pouch') {
      b = '<path d="M64 36Q64 26 74 26H126Q136 26 136 36L142 138Q142 144 136 144H64Q58 144 58 138Z" fill="' + H + '"/>' +
        '<rect x="64" y="26" width="72" height="12" rx="4" fill="' + tm + '" opacity=".45"/>' +
        '<path d="M68 46H132" stroke="' + tm + '" stroke-width="2" stroke-dasharray="3 3" opacity=".6"/>' +
        '<rect x="72" y="62" width="56" height="52" rx="8" fill="#FFF8EE"/>' + tx(100, 92, f[1]) +
        '<path d="M88 102Q100 96 112 102" stroke="' + c + '" stroke-width="3" fill="none" stroke-linecap="round"/>' + blik('M70 42Q66 90 68 134');
    } else if (f[0] === 'kanistra') {
      b = '<path d="M80 50V32Q80 24 88 24H112Q120 24 120 32V50" fill="none" stroke="' + tm + '" stroke-width="9" stroke-linejoin="round"/>' +
        '<rect x="126" y="30" width="16" height="16" rx="3" fill="' + tm + '"/>' +
        '<rect x="56" y="44" width="92" height="100" rx="14" fill="' + H + '"/>' +
        '<rect x="68" y="72" width="66" height="48" rx="8" fill="#FFFFFF"/>' + tx(101, 102, f[1], 17) + blik('M64 56V130');
    } else if (f[0] === 'korob' || f[0] === 'pachka') {
      var kr = f[0] === 'korob', ve = kr ? '#E6C590' : sv, le = kr ? '#CFA064' : c, pr = kr ? '#AE8047' : tm;
      b = '<path d="M100 40L152 62L100 84L48 62Z" fill="' + ve + '"/><path d="M48 62L100 84V140L48 118Z" fill="' + le + '"/>' +
        '<path d="M100 84L152 62V118L100 140Z" fill="' + pr + '"/>' +
        (kr ? '<path d="M74 51L126 73" stroke="#F4E2BE" stroke-width="8"/><path d="M126 73V129" stroke="#D9B988" stroke-width="8"/>' +
          '<path d="M64 104v-12m-4 4l4-4l4 4M78 110v-12m-4 4l4-4l4 4" stroke="#7A5530" stroke-width="2" fill="none" stroke-linecap="round"/>'
          : '<path d="M56 84L92 100V124L56 108Z" fill="#FFFFFF"/><path d="M62 96L86 107M62 103L80 111" stroke="' + c + '" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M84 47L116 61" stroke="#FFFFFF" stroke-width="6" opacity=".7" stroke-linecap="round"/>');
    } else if (f[0] === 'rulon') {
      b = '<ellipse cx="100" cy="136" rx="40" ry="12" fill="#A9CBE2"/><rect x="60" y="40" width="80" height="96" fill="' + F + '"/>' +
        '<ellipse cx="100" cy="40" rx="40" ry="12" fill="#EAF5FC" stroke="#BCD9EC" stroke-width="1.5"/>' +
        '<ellipse cx="100" cy="40" rx="13" ry="4.5" fill="#B08556"/><ellipse cx="100" cy="40" rx="7" ry="2.4" fill="#6E4F2E"/>' +
        '<path d="M72 50V128M80 52V130" stroke="#FFFFFF" stroke-width="3" opacity=".75"/>' +
        '<path d="M140 96Q156 104 150 122" stroke="#CFE6F4" stroke-width="8" fill="none" opacity=".8" stroke-linecap="round"/>';
    } else if (f[0] === 'stopka') {
      for (var i = 0; i < 4; i++) {
        var y = 116 - i * 22;
        b += '<rect x="48" y="' + y + '" width="104" height="26" rx="12" fill="' + (i % 2 ? c : sv) + '"/>' +
          '<path d="M58 ' + (y + 13) + 'H142" stroke="' + tm + '" stroke-width="1.5" opacity=".25"/>';
      }
      b += '<rect x="86" y="46" width="28" height="96" fill="#FFFFFF" opacity=".92"/>' + tx(100, 100, f[1], 9);
    } else if (f[0] === 'tarelki') {
      for (var j = 0; j < 6; j++) b += '<ellipse cx="100" cy="' + (132 - j * 9) + '" rx="64" ry="15" fill="#DDECF6" stroke="#9CBFD8" stroke-width="1.5"/>';
      b += '<ellipse cx="100" cy="87" rx="40" ry="8" fill="#EEF6FB" stroke="#B7D2E5"/>' +
        '<path d="M52 82Q60 74 78 72" stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round"/>';
    } else if (f[0] === 'meshok') {
      b = '<path d="M58 50Q62 34 76 38Q100 30 124 38Q138 34 142 50L150 134Q150 144 138 144H62Q50 144 50 134Z" fill="' + H + '"/>' +
        '<path d="M60 48Q100 40 140 48" stroke="' + tm + '" stroke-width="3" fill="none"/>' +
        '<rect x="70" y="68" width="60" height="56" rx="10" fill="#FFFFFF"/>' +
        '<circle cx="100" cy="94" r="9" fill="' + c + '"/><circle cx="88" cy="81" r="4" fill="' + c + '"/><circle cx="96" cy="77" r="4" fill="' + c + '"/>' +
        '<circle cx="104" cy="77" r="4" fill="' + c + '"/><circle cx="112" cy="81" r="4" fill="' + c + '"/>' + tx(100, 118, f[1], 11) + blik('M62 56Q58 96 60 134');
    } else {
      b = '<rect x="36" y="80" width="18" height="9" rx="4.5" fill="#7C8A9A"/><rect x="146" y="80" width="18" height="9" rx="4.5" fill="#7C8A9A"/>' +
        '<path d="M52 70H148V126Q148 142 132 142H68Q52 142 52 126Z" fill="' + M + '"/>' +
        '<ellipse cx="100" cy="70" rx="52" ry="11" fill="#DDE4EB" stroke="#9AA7B5" stroke-width="1.5"/>' +
        '<rect x="90" y="52" width="20" height="12" rx="5" fill="#2B3B4F"/>' + blik('M62 80V128');
    }
    return '<svg class="' + (kl || 'upak') + '" viewBox="0 0 200 160" aria-hidden="true">' + d + s + b + '</svg>';
  }
  var PIN = '<svg class="pin" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5a4.8 4.8 0 0 0-4.8 4.8c0 3.4 4.8 8.2 4.8 8.2s4.8-4.8 4.8-8.2A4.8 4.8 0 0 0 8 1.5zm0 6.6a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6z" fill="currentColor"/></svg>';
  var ZV = '<svg class="zv" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.2l2 4.3 4.7.5-3.5 3.2 1 4.6L8 11.5l-4.2 2.3 1-4.6L1.3 6l4.7-.5z" fill="currentColor"/></svg>';

  /* лестница цен: чем больше берёте, тем выше ступень и ниже цена за штуку */
  function lestnica(t) {
    return '<div class="lv-lest" aria-label="Цена за штуку: штучно ' + rub(t.one) + ', коробом ' + rub(t.box) + ', паллетой ' + rub(t.pal) + '">' +
      [['one', 'шт'], ['box', t.boxName], ['pal', 'паллета']].map(function (x, i) {
        return '<span style="--st:' + i + '"><b>' + t[x[0]].toLocaleString('ru-RU') + '</b><small>' + x[1] + '</small></span>';
      }).join('') + '</div>';
  }
  function tint(t) { return 'linear-gradient(150deg,' + mix(t.cvet, '#FFFFFF', .84) + ',' + mix(t.cvet, '#FFFFFF', .62) + ')'; }
  function ssylka(t) { return R + 'lavka/tovar/?id=' + t.id; }

  function kartochka(t, o) {
    o = o || {};
    return '<article class="lv-k' + (o.vitrina ? ' lv-k-vitr' : '') + '" style="--i:' + (o.i || 0) + '">' +
      '<a class="lv-foto" href="' + (o.bezSsylki ? '#' : ssylka(t)) + '" style="background:' + tint(t) + '" tabindex="-1" aria-hidden="true">' +
      (o.vitrina ? '<span class="lv-badge lv-badge-v">Первая полка</span>' : t.badge ? '<span class="lv-badge">' + esc(t.badge) + '</span>' : '') +
      upak(t) + '<span class="lv-mesto">' + PIN + esc(t.mesto) + '</span></a>' +
      '<div class="lv-t"><p class="lv-sel">' + esc(t.sel) + ' <span class="lv-r">' + ZV + reyt(t.reyting) + '</span></p>' +
      '<h3><a href="' + (o.bezSsylki ? '#' : ssylka(t)) + '">' + esc(t.name) + '</a></h3>' + lestnica(t) +
      '<div class="lv-niz"><span class="lv-cena"><b>от ' + rub(t.pal) + '</b><small>за шт, паллетой</small></span>' +
      (o.bezKnopki ? '' : '<button class="btn btn-sm lv-v" type="button" data-v-korz="' + t.id + '">В корзину</button>') + '</div></div></article>';
  }

  /* короб «улетает» в корзину в шапке: видно, куда делся товар */
  function polet(ot) {
    var cel = document.querySelector('.korz-l');
    if (!cel || !ot || tiho || !ot.animate) return;
    var a = ot.getBoundingClientRect(), b = cel.getBoundingClientRect();
    var k = document.createElement('div');
    k.className = 'lv-polet';
    k.style.left = (a.left + a.width / 2 - 14) + 'px'; k.style.top = (a.top + a.height / 2 - 14) + 'px';
    document.body.appendChild(k);
    var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    k.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: 'translate(' + dx * .5 + 'px,' + (dy * .5 - 60) + 'px) scale(.9)', opacity: 1, offset: .5 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.5)', opacity: .2 }],
      { duration: 560, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' }).onfinish = function () { k.remove(); };
  }
  function vKorzinu(id, u, q, ot) {
    var t = PO_ID[id];
    dobavit(id, u, q);
    polet(ot);
    T.toast('В корзине: ' + t.name.split(',')[0] + ', ' + edN(t, u, q), { deystvie: 'Открыть корзину', onClick: function () { location.href = R + 'lavka/korzina/'; } });
  }

  /* ---------- каталог ---------- */
  function katalog(box) {
    var p = new URLSearchParams(location.search), pervyy = true;
    var f = { q: p.get('q') || '', kat: p.get('kat') || '', pod: p.get('pod') || '', cena: '', sort: 'pop' };
    box.innerHTML =
      '<div class="lv-pan"><div class="lv-poisk">' +
      '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M13 13l4.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '<label class="skryt" for="lvQ">Поиск по Лавке</label><input id="lvQ" type="search" placeholder="Кофе, плёнка, тарелки" value="' + esc(f.q) + '"></div>' +
      '<div class="lv-chips" role="group" aria-label="Категория">' + [''].concat(D.kategorii).map(function (k) {
        return '<button type="button" data-kat="' + esc(k) + '" aria-pressed="' + (k === f.kat) + '">' + (k || 'Все товары') + '</button>';
      }).join('') + '</div></div>' +
      '<div class="lv-g"><details class="lv-filtr"' + (window.innerWidth > 900 ? ' open' : '') + '><summary>Фильтры</summary>' +
      '<h3>Для чего берёте</h3><div class="lv-pod">' + D.zachem.map(function (z) {
        return '<button type="button" data-pod="' + z[0] + '" aria-pressed="' + (z[0] === f.pod) + '">' + esc(z[1]) + '</button>';
      }).join('') + '</div>' +
      '<h3>Цена за штуку</h3><div class="vybor vybor-s">' + CENY.map(function (c) {
        return '<label><input type="radio" name="lv-cena" value="' + c[0] + '"' + (c[0] === f.cena ? ' checked' : '') + '><span>' + c[1] + '</span></label>';
      }).join('') + '</div>' +
      '<div class="lv-pomni"><b>Товар ждёт 7 дней</b><span>после оплаты он лежит на своём месте бесплатно, вывозите в любой день</span></div>' +
      '</details><div class="lv-spisok"><div class="lv-str"><p data-n aria-live="polite"></p>' +
      '<label class="lv-sort">Сначала <select data-sort><option value="pop">популярные</option><option value="deshevle">дешевле</option>' +
      '<option value="dorozhe">дороже</option><option value="reyting">с высоким рейтингом</option></select></label></div>' +
      '<div class="lv-setka" data-setka></div></div></div>';
    var setka = box.querySelector('[data-setka]'), nEl = box.querySelector('[data-n]');
    function podhodit(t) {
      if (f.kat && t.cat !== f.kat) return false;
      if (f.pod && PODBORKI[f.pod].indexOf(t.id) < 0) return false;
      if (f.q && (t.name + ' ' + t.sel + ' ' + t.cat).toLowerCase().indexOf(f.q.toLowerCase()) < 0) return false;
      var c = t.one;
      if (f.cena === 'p0' && c >= 100) return false;
      if (f.cena === 'p1' && (c < 100 || c > 500)) return false;
      if (f.cena === 'p2' && (c < 500 || c > 1500)) return false;
      if (f.cena === 'p3' && c < 1500) return false;
      return true;
    }
    function risovat() {
      var sp = D.tovary.filter(podhodit);
      if (f.sort === 'deshevle') sp.sort(function (a, b) { return a.one - b.one; });
      if (f.sort === 'dorozhe') sp.sort(function (a, b) { return b.one - a.one; });
      if (f.sort === 'reyting') sp.sort(function (a, b) { return b.reyting - a.reyting; });
      if (f.sort === 'pop') sp.sort(function (a, b) { return b.otzyvy - a.otzyvy; });
      nEl.textContent = sp.length ? 'Нашли ' + sp.length + ' ' + plural(sp.length, ['товар', 'товара', 'товаров']) : '';
      setka.classList.toggle('bez-anim', !pervyy);
      setka.innerHTML = sp.length ? sp.map(function (t, i) { return kartochka(t, { i: i % 8 }); }).join('') :
        '<div class="lv-pusto"><b>Ничего не нашли</b><p class="muted">Попробуйте другое слово или сбросьте фильтры. Не нашли нужное? Спросите нас: товар могут привезти под заказ.</p>' +
        '<button class="btn btn-2 btn-sm" type="button" data-sbros>Сбросить фильтры</button></div>';
      pervyy = false;
    }
    function knopki(sel, zn) { box.querySelectorAll(sel).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute(sel.slice(1, -1)) === zn); }); }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-kat')) { f.kat = b.getAttribute('data-kat'); knopki('[data-kat]', f.kat); risovat(); }
      else if (b.hasAttribute('data-pod')) { f.pod = f.pod === b.getAttribute('data-pod') ? '' : b.getAttribute('data-pod'); knopki('[data-pod]', f.pod); risovat(); }
      else if (b.hasAttribute('data-sbros')) {
        f.q = ''; f.kat = ''; f.pod = ''; f.cena = '';
        box.querySelector('#lvQ').value = ''; box.querySelector('[name=lv-cena][value=""]').checked = true;
        knopki('[data-kat]', ''); knopki('[data-pod]', ''); risovat();
      }
      else if (b.hasAttribute('data-v-korz')) vKorzinu(+b.getAttribute('data-v-korz'), 'box', 1, b.closest('.lv-k').querySelector('.upak'));
    });
    box.querySelector('#lvQ').addEventListener('input', function (e) { f.q = e.target.value.trim(); risovat(); });
    box.addEventListener('change', function (e) {
      if (e.target.name === 'lv-cena') { f.cena = e.target.value; risovat(); }
      if (e.target.hasAttribute('data-sort')) { f.sort = e.target.value; risovat(); }
    });
    risovat();
  }
  API.katalog = katalog;

  /* на главной и в других местах: несколько карточек из Лавки */
  function vitrinka(box) {
    var ids = (box.getAttribute('data-ids') || '5,1,3,8').split(',').map(Number);
    box.innerHTML = ids.map(function (id, i) { return PO_ID[id] ? kartochka(PO_ID[id], { i: i }) : ''; }).join('');
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-v-korz]');
      if (b) vKorzinu(+b.getAttribute('data-v-korz'), 'box', 1, b.closest('.lv-k').querySelector('.upak'));
    });
  }
  API.vitrinka = vitrinka;

  /* стеллаж в герое Лавки: настоящий товар на полках, ценник на балке под каждым */
  function polka(box) {
    var ids = (box.getAttribute('data-ids') || '5,4,3,1,6,8').split(',').map(Number).filter(function (id) { return PO_ID[id]; });
    box.innerHTML = '<span class="lv-st-stoyka lv-st-l" aria-hidden="true"></span><span class="lv-st-stoyka lv-st-r" aria-hidden="true"></span>' +
      [ids.slice(0, 3), ids.slice(3, 6)].map(function (ryad, n) {
        return '<div class="lv-st-ryad">' + ryad.map(function (id, k) {
          var t = PO_ID[id];
          return '<a class="lv-st-t" href="' + ssylka(t) + '" style="--i:' + (n * 3 + k) + '">' + upak(t, 'lv-st-upak') +
            '<span class="lv-st-cen"><b>от ' + rub(t.pal) + '</b><small>' + esc(t.name.split(',')[0]) + '</small></span></a>';
        }).join('') + '</div><span class="lv-st-balka" aria-hidden="true"></span>';
      }).join('');
  }
  API.polka = polka;

  /* ---------- когда можно забрать: заказ до 16:00 в будни собираем в тот же день ---------- */
  function kogdaZabrat() {
    var d = new Date(), den = d.getDay(), h = d.getHours();
    if (den >= 1 && den <= 5 && h < 16) return 'сегодня';
    var n = new Date(d), dni = ['в воскресенье', 'в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу'];
    do { n.setDate(n.getDate() + 1); } while (n.getDay() === 0 || n.getDay() === 6);
    return Math.round((new Date(n.getFullYear(), n.getMonth(), n.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5) === 1 ? 'завтра' : dni[n.getDay()];
  }
  var PRED = { 'короб': 'коробе', 'упаковка': 'упаковке', 'пачка': 'пачке' };
  function stepper(q, imya) {
    return '<div class="shtepper"><button type="button" data-minus aria-label="Меньше">−</button>' +
      '<input type="number" min="1" max="999" value="' + q + '" inputmode="numeric" aria-label="' + imya + '">' +
      '<button type="button" data-plus aria-label="Больше">+</button></div>';
  }
  function shag(inp, d) { inp.value = Math.max(1, Math.min(999, (parseInt(inp.value, 10) || 1) + d)); inp.dispatchEvent(new Event('input', { bubbles: true })); }

  /* ---------- товар ---------- */
  function tovar(box) {
    var id = +(new URLSearchParams(location.search).get('id')) || 5, t = PO_ID[id] || D.tovary[0], u = 'box';
    var kogda = kogdaZabrat(), otz = t.otzyvy;
    document.title = t.name + ': купить со склада в Химках | Лавка Тучи';
    var ur = ['one', 'box', 'pal'].map(function (x) {
      var pod = x === 'one' ? 'от 1 шт' : x === 'box' ? t.boxN + ' шт в ' + PRED[t.boxName] : t.palN.toLocaleString('ru-RU') + ' шт на паллете';
      return '<label class="tv-u"><input type="radio" name="tv-u" value="' + x + '"' + (x === u ? ' checked' : '') + '><span>' +
        '<b>' + UR[x] + '</b><small>' + pod + '</small><em>' + rub(t[x]) + ' за шт</em>' +
        (x !== 'one' ? '<i>−' + vygoda(t, x) + ' %</i>' : '') + '</span></label>';
    }).join('');
    box.innerHTML =
      '<nav class="kroshki" aria-label="Путь"><a href="' + R + '../novyy/lavka/">Лавка</a><span aria-hidden="true">/</span>' +
      '<a href="' + R + 'lavka/?kat=' + encodeURIComponent(t.cat) + '">' + esc(t.cat) + '</a><span aria-hidden="true">/</span><span>' + esc(t.name.split(',')[0]) + '</span></nav>' +
      '<div class="tv-g"><div class="tv-foto" style="background:' + tint(t) + '">' +
      (t.badge ? '<span class="lv-badge">' + esc(t.badge) + '</span>' : '') + upak(t, 'upak upak-bol') +
      '<span class="lv-mesto">' + PIN + 'Химки, ' + esc(t.mesto) + '</span></div>' +
      '<div class="tv-info"><p class="lv-sel">Продавец: <b>' + esc(t.sel) + '</b> <span class="lv-r">' + ZV + reyt(t.reyting) + '</span> · ' + otz + ' ' + plural(otz, ['отзыв', 'отзыва', 'отзывов']) + '</p>' +
      '<h1>' + esc(t.name) + '</h1><p class="pod">' + OPIS[t.id] + '</p>' +
      '<fieldset class="tv-ury"><legend>Как берёте</legend><div class="tv-ury-g">' + ur + '</div></fieldset>' +
      '<div class="tv-kol">' + stepper(1, 'Количество') + '<span data-ed></span></div>' +
      '<div class="tv-itog"><span>Итого</span><b data-sum></b><small data-za></small></div>' +
      '<div class="cta-pol"><button class="btn btn-bol" type="button" data-v>В корзину</button>' +
      '<button class="btn btn-2 btn-bol" type="button" data-kupit>Купить сейчас</button></div>' +
      '<ul class="tv-fakty"><li><b>Остаток</b>' + esc(t.stock) + '</li><li><b>Склад отгрузки</b>Химки, ' + esc(t.mesto) + '</li>' +
      '<li><b>Комплектация</b>от 2 часов, забрать можно ' + kogda + '</li></ul></div></div>' +
      '<section class="tv-sek"><h2>Как получить</h2><div class="tv-dost">' +
      '<div><b>Самовывоз ' + kogda + '</b><span>Химки, Подолино, пн-пт с 9:00 до 18:00</span><em>0 ₽</em></div>' +
      '<div><b>Доставка попуткой</b><span>по Москве и области, когда машина едет в вашу сторону</span><em>от 1 400 ₽</em></div>' +
      '<div><b>Транспортной компанией</b><span>до терминала довезём сами, дальше по тарифу перевозчика</span><em>по тарифу</em></div></div>' +
      '<p class="muted">Товар ждёт на своём месте 7 дней после оплаты, вывозите в любой день. Нужно дольше: оформим хранение по прайсу склада.</p></section>' +
      '<section class="tv-sek tv-dva"><div><h2>Характеристики</h2><dl class="tv-har">' +
      [['Категория', t.cat], ['Продаётся', UR.box.toLowerCase() + ' по ' + t.boxN + ' шт, паллетами по ' + t.palN.toLocaleString('ru-RU') + ' шт'],
        ['Остаток', t.stock], ['Где лежит', 'Химки, ' + t.mesto], ['Продавец', t.sel]].map(function (x) {
        return '<div><dt>' + x[0] + '</dt><dd>' + esc(x[1]) + '</dd></div>';
      }).join('') + '</dl></div>' +
      '<div><h2>Отзывы покупателей</h2><p class="muted">Пишут только те, кто действительно забрал товар</p>' +
      '<div class="tv-otz"><div class="tv-otz-b"><b>' + reyt(t.reyting) + '</b><span class="lv-r">' + ZV + ZV + ZV + ZV + ZV + '</span><small>' + otz + ' ' + plural(otz, ['отзыв', 'отзыва', 'отзывов']) + '</small></div>' +
      '<ul><li><b>' + Math.round(otz * .91) + '</b> забрали сами со склада</li><li><b>' + Math.round(otz * .83) + '</b> заказывали повторно</li><li><b>0</b> вернули товар</li></ul></div></div></section>' +
      '<section class="tv-sek"><h2>С этим часто берут</h2><p class="muted">Лежит на том же складе: заберёте одной машиной</p><div class="lv-setka lv-setka-4" data-etim></div></section>';
    var inp = box.querySelector('.tv-kol input');
    function schet() {
      var q = Math.max(1, parseInt(inp.value, 10) || 1);
      box.querySelector('[data-ed]').textContent = plural(q, FORMY[ed(t, u)]) + (u === 'one' ? '' : ' · ' + (q * N(t, u)).toLocaleString('ru-RU') + ' шт');
      box.querySelector('[data-sum]').textContent = rub(summa(t, u, q));
      box.querySelector('[data-za]').textContent = rub(t[u]) + ' за шт' + (u !== 'one' ? ', экономия ' + rub((t.one - t[u]) * q * N(t, u)) : '');
    }
    box.addEventListener('change', function (e) { if (e.target.name === 'tv-u') { u = e.target.value; inp.value = 1; schet(); } });
    inp.addEventListener('input', schet);
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-minus')) shag(inp, -1);
      else if (b.hasAttribute('data-plus')) shag(inp, 1);
      else if (b.hasAttribute('data-v')) vKorzinu(t.id, u, Math.max(1, parseInt(inp.value, 10) || 1), box.querySelector('.upak-bol'));
      else if (b.hasAttribute('data-kupit')) { dobavit(t.id, u, Math.max(1, parseInt(inp.value, 10) || 1)); location.href = R + 'lavka/zakaz/'; }
      else if (b.hasAttribute('data-v-korz')) vKorzinu(+b.getAttribute('data-v-korz'), 'box', 1, b.closest('.lv-k').querySelector('.upak'));
    });
    var ryadom = D.tovary.filter(function (x) { return x.id !== t.id && (x.cat === t.cat || x.sel === t.sel); });
    D.tovary.forEach(function (x) { if (ryadom.length < 4 && x.id !== t.id && ryadom.indexOf(x) < 0) ryadom.push(x); });
    box.querySelector('[data-etim]').innerHTML = ryadom.slice(0, 4).map(function (x, i) { return kartochka(x, { i: i }); }).join('');
    schet();
  }
  API.tovar = tovar;

  /* ---------- корзина ---------- */
  function mestaTxt(m) { return m.toLocaleString('ru-RU', { maximumFractionDigits: 1 }); }
  function blokMashina(m) {
    var kl = Math.min(m.vsego, 15), per = m.vsego / kl, ost = Math.max(0, m.vsego - m.zanyato), yach = '';
    for (var i = 0; i < kl; i++) yach += '<i style="--z:' + Math.max(0, Math.min(1, (m.zanyato - i * per) / per)).toFixed(2) + '"></i>';
    return '<div class="kz-mash"><p class="kz-mash-h"><b>Сколько места займёт</b><small>Считаем машину по объёму, а не по числу коробок</small></p>' +
      '<div class="kz-mesta" style="--n:' + kl + '" aria-hidden="true">' + yach + '</div>' +
      '<p class="kz-mash-t"><b>' + m.imya + '</b> · ' + mestaTxt(m.zanyato) + ' из ' + m.vsego + ' паллето-мест</p>' +
      (m.dost ? '<p class="muted">' + (ost >= 1 ? 'Осталось ' + mestaTxt(ost) + ' ' + plural(Math.floor(ost), ['место', 'места', 'мест']) + ': доставка не подорожает' : 'Машина полная') + '</p>'
        : '<p class="muted">Стоимость отдельной машины назовём, когда подтвердим заказ</p>') + '</div>';
  }
  function korzina(box) {
    function stroka(x, i) {
      var t = PO_ID[x.id];
      return '<div class="kz-str" data-i="' + i + '"><a class="kz-foto" href="' + ssylka(t) + '" style="background:' + tint(t) + '" tabindex="-1" aria-hidden="true">' + upak(t) + '</a>' +
        '<div class="kz-t"><a class="kz-n" href="' + ssylka(t) + '">' + esc(t.name) + '</a>' +
        '<p class="muted">' + esc(t.sel) + ' · лежит: ' + esc(t.mesto) + '</p>' +
        '<div class="kz-u" role="group" aria-label="Как берёте">' + ['one', 'box', 'pal'].map(function (u) {
          return '<button type="button" data-u="' + u + '" aria-pressed="' + (u === x.u) + '">' +
            (u === 'one' ? 'штучно' : u === 'box' ? t.boxName + ' ' + t.boxN + ' шт' : 'паллета ' + t.palN.toLocaleString('ru-RU') + ' шт') + '</button>';
        }).join('') + '</div></div>' +
        '<div class="kz-kol">' + stepper(x.q, 'Количество: ' + esc(t.name)) + '<small>' + plural(x.q, FORMY[ed(t, x.u)]) + '</small></div>' +
        '<div class="kz-s"><b>' + rub(summa(t, x.u, x.q)) + '</b><small>' + rub(t[x.u]) + ' за шт</small></div>' +
        '<button type="button" class="kz-x" data-x aria-label="Убрать из корзины: ' + esc(t.name) + '">×</button></div>';
    }
    function risovat() {
      var k = korz();
      if (!k.length) {
        box.innerHTML = '<div class="lv-pusto lv-pusto-bol"><div class="lv-pusto-il" style="background:' + tint(PO_ID[7] || D.tovary[0]) + '">' + upak(PO_ID[7] || D.tovary[0]) + '</div>' +
          '<b>Корзина пустая</b><p class="muted">Товар лежит на складе и ждёт. Берите от штуки до паллеты: чем больше, тем ниже цена за штуку.</p>' +
          '<a class="btn" href="' + R + '../novyy/lavka/">Открыть Лавку</a></div>';
        return;
      }
      var it = itogi(k), m = mashina(it.mesta);
      box.innerHTML = '<div class="kz-g"><div class="kz-sp">' + k.map(stroka).join('') +
        '<p class="muted kz-p">Всё лежит на одном складе в Химках: уедет одной машиной.</p></div>' +
        '<aside class="kz-itog">' + blokMashina(m) +
        '<dl class="kz-dl"><div><dt>Товары, ' + it.poz + ' ' + plural(it.poz, ['позиция', 'позиции', 'позиций']) + '</dt><dd>' + rub(it.sum) + '</dd></div>' +
        '<div><dt>Доставка</dt><dd>выберете дальше</dd></div><div><dt>Неделя хранения</dt><dd>0 ₽</dd></div></dl>' +
        '<div class="kz-k"><span>К оплате</span><b>' + rub(it.sum) + '</b></div>' +
        '<a class="btn btn-bol" href="' + R + '../novyy/lavka/zakaz/">Оформить заказ</a>' +
        '<p class="muted kz-mel">Дальше выберете, забрать самому или привезти. Товар ждёт на складе неделю бесплатно.</p></aside></div>';
    }
    function izm(i, fn) { var k = korz(); fn(k, k[i]); sohrKorz(k.filter(function (x) { return x.q > 0; })); risovat(); }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button'), s = b && b.closest('.kz-str');
      if (!s) return;
      var i = +s.getAttribute('data-i');
      if (b.hasAttribute('data-minus') || b.hasAttribute('data-plus')) {
        var d = b.hasAttribute('data-plus') ? 1 : -1;
        izm(i, function (k, x) { x.q = Math.max(1, x.q + d); });
      } else if (b.hasAttribute('data-u')) {
        izm(i, function (k, x) {
          x.u = b.getAttribute('data-u'); x.q = 1;
          k.forEach(function (y) { if (y !== x && y.id === x.id && y.u === x.u) { x.q += y.q; y.q = 0; } });
        });
      } else if (b.hasAttribute('data-x')) {
        var k0 = korz(), ubr = k0[i];
        izm(i, function (k, x) { x.q = 0; });
        T.toast('Убрали из корзины', { deystvie: 'Вернуть', onClick: function () { var k = korz(); k.splice(i, 0, ubr); sohrKorz(k); risovat(); } });
      }
    });
    box.addEventListener('change', function (e) {
      var s = e.target.closest('.kz-str');
      if (s && e.target.type === 'number') izm(+s.getAttribute('data-i'), function (k, x) { x.q = Math.max(1, Math.min(999, parseInt(e.target.value, 10) || 1)); });
    });
    risovat();
  }
  API.korzina = korzina;

  /* ---------- даты ---------- */
  var MES = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  function data(ts) { var d = new Date(ts); return d.getDate() + ' ' + MES[d.getMonth()]; }
  function rabDni(n) {
    var r = [], d = new Date();
    while (r.length < n) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) r.push(new Date(d)); }
    return r;
  }
  function kogdaZvonok() {
    var d = new Date(), den = d.getDay(), h = d.getHours();
    return den >= 1 && den <= 5 && h >= 9 && h < 18 ? 'в течение 15 минут' : T.kogdaSvyazhetsya();
  }
  var STATUSY = { sam: ['Принят', 'Собираем', 'Готов к выдаче', 'Получен'], dost: ['Принят', 'Собираем', 'В пути', 'Получен'] };
  var TIPY = { sam: 'Самовывоз', poputka: 'Доставка попуткой', tk: 'Транспортной компанией' };
  var OPL = { karta: 'Картой', schet: 'По счёту', poluch: 'При получении' };

  /* ---------- оформление заказа ---------- */
  function zakaz(box) {
    var a = T.sessiya() ? T.akk() : null, k = korz(), shagN = 1;
    var z = { tip: 'sam', adres: '', den: '', vremya: 'u', imya: a ? a.imya || '' : '', tel: a ? a.tel || '' : '', pochta: a ? a.pochta || '' : '',
      na: a ? 'komp' : 'sebya', inn: a ? a.inn || '' : '', komp: a ? a.kompaniya || '' : '', oplata: 'karta' };
    if (!k.length) { korzina(box); return; }
    var it = itogi(k), m = mashina(it.mesta), kogda = kogdaZabrat(), dni = rabDni(5);
    function dostCena() { return z.tip === 'poputka' ? m.dost : 0; }
    function dostTxt() { return z.tip === 'sam' ? '0 ₽' : z.tip === 'tk' ? 'по тарифу ТК' : m.dost ? rub(m.dost) : 'по расчёту'; }
    function vsego() { return it.sum + dostCena(); }
    function svodka() {
      return '<p class="kz-mash-h"><b>Ваш заказ</b><small>' + it.poz + ' ' + plural(it.poz, ['позиция', 'позиции', 'позиций']) + ', одна машина</small></p>' +
        '<ol class="zk-poz">' + k.map(function (x) {
          var t = PO_ID[x.id];
          return '<li><span>' + esc(t.name.split(',')[0]) + ' · ' + edN(t, x.u, x.q) + '</span><b>' + rub(summa(t, x.u, x.q)) + '</b></li>';
        }).join('') + '</ol>' +
        '<dl class="kz-dl"><div><dt>' + TIPY[z.tip] + '</dt><dd>' + dostTxt() + '</dd></div><div><dt>Хранение неделю</dt><dd>0 ₽</dd></div></dl>' +
        '<div class="kz-k"><span>Итого</span><b>' + rub(vsego()) + '</b></div><p class="muted kz-mel">Что-то не сходится? <a href="' + R + '../novyy/kontakty/">Напишите нам</a>, разберёмся до оплаты.</p>';
    }
    function var_(name, zn, tek, zag, pod, cena) {
      return '<label class="zk-var"><input type="radio" name="' + name + '" value="' + zn + '"' + (zn === tek ? ' checked' : '') + '>' +
        '<span><b>' + zag + '</b><small>' + pod + '</small>' + (cena ? '<em>' + cena + '</em>' : '') + '</span></label>';
    }
    function pole(id, label, zn, tip, osh, dop) {
      return '<div class="pole" data-p="' + id + '"><label for="zk-' + id + '">' + label + '</label><input id="zk-' + id + '" name="' + id + '" type="' + (tip || 'text') + '" value="' + esc(zn) + '"' + (dop || '') + '>' +
        '<p class="osh-t">' + osh + '</p></div>';
    }
    function shag1() {
      var h = '<h2>Как получить</h2><p class="muted">Склад отгрузки: Химки, Подолино. Паллеты собираем от 2 часов, сборные заказы до конца дня.</p>' +
        '<div class="zk-vary">' + var_('tip', 'sam', z.tip, 'Самовывоз ' + kogda, 'Промышленная зона, 2Б · пн-пт с 9:00 до 18:00', '0 ₽') +
        var_('tip', 'poputka', z.tip, 'Доставка попуткой', 'По Москве и области, ' + m.imya.toLowerCase() + ' едет в вашу сторону', m.dost ? rub(m.dost) : 'по расчёту') +
        var_('tip', 'tk', z.tip, 'Транспортной компанией', 'Довезём до терминала, дальше по тарифу перевозчика', 'по тарифу') + '</div>';
      if (z.tip !== 'sam') {
        h += pole('adres', z.tip === 'tk' ? 'Город и транспортная компания' : 'Адрес доставки', z.adres, 'text',
          'Укажите адрес: без него не рассчитаем машину', ' autocomplete="street-address"') +
          '<div class="zk-dva"><div class="pole"><label for="zk-den">Дата</label><select id="zk-den" name="den">' + dni.map(function (d) {
            var v = d.toISOString().slice(0, 10);
            return '<option value="' + v + '"' + (v === z.den ? ' selected' : '') + '>' + ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][d.getDay()] + ', ' + data(d) + '</option>';
          }).join('') + '</select></div>' +
          '<fieldset class="pole"><legend>Время</legend><div class="vybor vybor-s">' +
          '<label><input type="radio" name="vremya" value="u"' + (z.vremya === 'u' ? ' checked' : '') + '><span>9:00-13:00</span></label>' +
          '<label><input type="radio" name="vremya" value="d"' + (z.vremya === 'd' ? ' checked' : '') + '><span>13:00-18:00</span></label></div></fieldset></div>';
      } else h += '<p class="zk-zhdyot"><b>Товар ждёт вас неделю бесплатно</b>, торопиться не нужно: приезжайте в любой будний день.</p>';
      return h + '<div class="shag-niz"><a class="btn-t" href="' + R + '../novyy/lavka/korzina/">Назад в корзину</a><button type="submit" class="btn">Дальше</button></div>';
    }
    function shag2() {
      return '<h2>Кто получает</h2><p class="muted">Кладовщик спросит имя при выдаче' + (z.tip === 'poputka' ? ', водитель позвонит перед приездом' : '') + '.</p>' +
        pole('imya', 'Имя и фамилия', z.imya, 'text', 'Как к вам обращаться?', ' autocomplete="name"') +
        pole('tel', 'Телефон', z.tel, 'tel', 'Нужно 11 цифр: по нему позвонят со склада', ' autocomplete="tel"') +
        pole('pochta', 'Почта для чека <span class="nb">необязательно</span>', z.pochta, 'email', 'Проверьте адрес: похоже, в нём опечатка', ' autocomplete="email"') +
        '<div class="shag-niz"><button type="button" class="btn-t" data-nazad>Назад</button><button type="submit" class="btn">Дальше</button></div>';
    }
    function shag3() {
      var komp = z.na === 'komp';
      if (!komp && z.oplata === 'schet') z.oplata = 'karta';
      return '<h2>Оплата</h2>' +
        '<fieldset class="pole"><legend>На кого оформить документы</legend><div class="zk-vary zk-vary-2">' +
        var_('na', 'sebya', z.na, 'На себя', 'чек на почту, договор не нужен') + var_('na', 'komp', z.na, 'На компанию', 'счёт, УПД и накладная') + '</div></fieldset>' +
        (komp ? '<div class="zk-dva">' + pole('inn', 'ИНН', z.inn, 'text', 'ИНН: 10 цифр для компании или 12 для ИП', ' inputmode="numeric" maxlength="12"') +
          pole('komp', 'Название организации', z.komp, 'text', 'Название нужно для счёта', ' autocomplete="organization"') + '</div>' : '') +
        '<fieldset class="pole"><legend>Как оплатить</legend><div class="zk-vary">' +
        var_('oplata', 'karta', z.oplata, 'Картой', 'спишем сразу, чек на почту') +
        (komp ? var_('oplata', 'schet', z.oplata, 'По счёту', 'УПД и накладная, 3 дня на оплату') : '') +
        var_('oplata', 'poluch', z.oplata, 'При получении', 'наличными или картой на складе') + '</div></fieldset>' +
        '<div class="pole" data-p="sogl"><label class="galka"><input type="checkbox" name="sogl"><span>Согласен на обработку персональных данных, <a href="' + R + 'dokumenty/#soglasie" target="_blank">текст согласия</a></span></label>' +
        '<p class="osh-t">Без согласия мы не можем оформить заказ</p></div>' +
        '<div class="shag-niz"><button type="button" class="btn-t" data-nazad>Назад</button><button type="submit" class="btn">' +
        (z.oplata === 'karta' ? 'Оплатить ' + rub(vsego()) : z.oplata === 'schet' ? 'Выставить счёт' : 'Забронировать товар') + '</button></div>' +
        '<p class="muted kz-mel">' + (z.oplata === 'karta' ? 'Деньги спишутся только после подтверждения в банке.' : 'Заказ держим за вами ' + (z.oplata === 'schet' ? 'три дня, пока идёт оплата.' : 'неделю, платите на складе.')) + '</p>';
    }
    function kartaEkran() {
      return '<h2>Оплата картой</h2><div class="zk-karta" aria-hidden="true"><span>КАРТА</span><b data-kn>•••• •••• •••• ••••</b><small><i data-kv>ИМЯ НА КАРТЕ</i><i data-ks>••/••</i></small></div>' +
        pole('kn', 'Номер карты', '', 'text', 'Проверьте номер: нужно 16 цифр', ' inputmode="numeric" autocomplete="cc-number" maxlength="19"') +
        '<div class="zk-dva zk-tri">' + pole('kv', 'Имя на карте', '', 'text', 'Как написано на карте', ' autocomplete="cc-name"') +
        pole('ks', 'Срок', '', 'text', 'ММ/ГГ', ' inputmode="numeric" autocomplete="cc-exp" maxlength="5" placeholder="ММ/ГГ"') +
        pole('cvc', 'CVC', '', 'password', '3 цифры с обратной стороны', ' inputmode="numeric" autocomplete="cc-csc" maxlength="3"') + '</div>' +
        '<p><span class="demo">Демо: деньги не спишутся, подойдёт любой номер из 16 цифр</span></p>' +
        '<div class="shag-niz"><button type="button" class="btn-t" data-nazad>Назад</button><button type="submit" class="btn">Оплатить ' + rub(vsego()) + '</button></div>' +
        '<p class="muted kz-mel">Данные карты уходят напрямую в банк: сайт их не видит и не хранит.</p>';
    }
    function bankEkran() {
      return '<div class="zk-bank"><p class="zk-bank-v">Защищённая страница банка</p><h2>Подтвердите оплату</h2>' +
        '<p class="muted">Отправили код на номер, привязанный к карте •••• ' + z.karta + '. Сумма: ' + rub(vsego()) + '.</p>' +
        '<div class="kod" role="group" aria-label="Код из четырёх цифр">' + [1, 2, 3, 4].map(function (i) { return '<input inputmode="numeric" maxlength="1" aria-label="Цифра ' + i + '">'; }).join('') + '</div>' +
        '<p><span class="demo">Демо: подойдёт любой код из четырёх цифр</span></p></div>';
    }
    function gotovo(o) {
      var st = STATUSY[o.tip === 'sam' ? 'sam' : 'dost'], zhdyot = data(o.t + 7 * 864e5);
      return '<div class="zk-gotovo"><div class="zk-galka" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M13 25l7 7 15-16" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
        '<p class="eb">' + (o.oplata === 'karta' ? 'Оплачено' : o.oplata === 'schet' ? 'Счёт выставлен' : 'Товар забронирован') + '</p>' +
        '<h2>Заказ № ' + o.n + ' принят</h2>' +
        '<div class="zk-status">' + st.map(function (x, i) { return '<span class="' + (i === 0 ? 'on' : '') + '">' + x + '</span>'; }).join('') + '</div>' +
        '<ul class="spis-ok"><li>Собираем ' + kogda + '. Как соберём, пришлём фото' + (o.tip === 'sam' ? ' и позовём за товаром.' : ' загрузки и номер машины.') + '</li>' +
        '<li>Товар ждёт на складе до ' + zhdyot + ', вывезти можно в любой будний день.</li>' +
        '<li>Пётр Ким, выдача заказов, позвонит ' + kogdaZvonok() + ' и подтвердит время.</li></ul>' +
        (o.oplata === 'schet' ? '<dl class="zk-schet"><div><dt>Плательщик</dt><dd>' + esc(o.komp) + ', ИНН ' + esc(o.inn) + '</dd></div>' +
          '<div><dt>Получатель</dt><dd>ООО «Туча - Мировая Лавка»</dd></div><div><dt>Счёт</dt><dd>№ ' + o.n + ' от ' + data(o.t) + '</dd></div>' +
          '<div><dt>Сумма</dt><dd>' + rub(o.itog) + ', с НДС</dd></div><div><dt>Оплатить до</dt><dd>' + data(o.t + 3 * 864e5) + '</dd></div></dl>' +
          '<p class="muted">Счёт отправили на почту. УПД и накладную приложим при отгрузке.</p>' : '') +
        (o.oplata === 'karta' ? '<p class="muted">Оплатили картой •••• ' + o.karta + '. Чек ' + (o.pochta ? 'отправили на ' + esc(o.pochta) : 'придёт SMS') + '.</p>' : '') +
        '<div class="cta-pol"><a class="btn" href="' + R + '../novyy/lavka/pokupki/">Мои покупки</a><a class="btn btn-2" href="' + R + '../novyy/lavka/">Вернуться в Лавку</a></div></div>';
    }
    function oformit(dop) {
      var sp = T.st.get(KZ) || [];
      var o = Object.assign({ n: 4181 + sp.length, t: Date.now(), poz: k, sum: it.sum, dost: dostCena(), itog: vsego(), status: 0 }, z, dop || {});
      sp.unshift(o); T.st.set(KZ, sp);
      sohrKorz([]);
      T.goal('lavka_zakaz');
      box.innerHTML = gotovo(o);
      window.scrollTo({ top: 0, behavior: tiho ? 'auto' : 'smooth' });
    }
    box.innerHTML = '<div class="zk-g"><div class="zk-osn kart"><ol class="zk-shagi" aria-label="Шаги">' +
      ['Как получить', 'Кто получает', 'Оплата'].map(function (x, i) { return '<li data-sh="' + (i + 1) + '"><i>' + (i + 1) + '</i>' + x + '</li>'; }).join('') + '</ol>' +
      '<form novalidate data-f></form></div><aside class="kz-itog zk-sv" data-sv></aside></div>';
    var f = box.querySelector('[data-f]'), sv = box.querySelector('[data-sv]');
    function pokaz(n) {
      shagN = n;
      f.innerHTML = n === 1 ? shag1() : n === 2 ? shag2() : n === 3 ? shag3() : n === 4 ? kartaEkran() : bankEkran();
      box.querySelectorAll('[data-sh]').forEach(function (l) { var i = +l.getAttribute('data-sh'); l.className = i < Math.min(n, 3) ? 'done' : i === Math.min(n, 3) ? 'on' : ''; });
      sv.innerHTML = svodka();
      var tel = f.querySelector('#zk-tel'); if (tel) { T.maska(tel); if (tel.value) tel.value = T.telFormat(tel.value); }
      if (n === 4) karta();
      if (n === 5) bank();
    }
    function prov(id, ok) { var p = f.querySelector('[data-p="' + id + '"]'); if (p) p.classList.toggle('osh', !ok); return ok; }
    function karta() {
      var kn = f.querySelector('#zk-kn'), kv = f.querySelector('#zk-kv'), ks = f.querySelector('#zk-ks');
      kn.addEventListener('input', function () {
        var d = kn.value.replace(/\D/g, '').slice(0, 16); kn.value = d.replace(/(\d{4})(?=\d)/g, '$1 ');
        f.querySelector('[data-kn]').textContent = (d + '••••••••••••••••').slice(0, 16).replace(/(.{4})(?=.)/g, '$1 ');
      });
      kv.addEventListener('input', function () { f.querySelector('[data-kv]').textContent = kv.value.toUpperCase() || 'ИМЯ НА КАРТЕ'; });
      ks.addEventListener('input', function () {
        var d = ks.value.replace(/\D/g, '').slice(0, 4); ks.value = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
        f.querySelector('[data-ks]').textContent = ks.value || '••/••';
      });
      kn.focus();
    }
    function bank() {
      var inp = f.querySelectorAll('.kod input');
      Array.prototype.forEach.call(inp, function (i, n) {
        i.addEventListener('input', function () {
          i.value = i.value.replace(/\D/g, '').slice(0, 1);
          if (i.value && n < 3) inp[n + 1].focus();
          if (Array.prototype.every.call(inp, function (x) { return x.value; })) {
            f.querySelector('.zk-bank').classList.add('idet');
            setTimeout(function () { oformit(); }, tiho ? 0 : 700);
          }
        });
        i.addEventListener('keydown', function (e) { if (e.key === 'Backspace' && !i.value && n > 0) inp[n - 1].focus(); });
      });
      inp[0].focus();
    }
    f.addEventListener('change', function (e) {
      var t = e.target;
      if (t.name === 'tip' || t.name === 'na' || t.name === 'oplata') { z[t.name] = t.value; pokaz(shagN); var v = f.querySelector('[name="' + t.name + '"]:checked'); v && v.focus(); }
      if (t.name === 'den') z.den = t.value;
      if (t.name === 'vremya') z.vremya = t.value;
    });
    f.addEventListener('input', function (e) { if (e.target.name && e.target.name in z) z[e.target.name] = e.target.value; });
    f.addEventListener('click', function (e) { if (e.target.closest('[data-nazad]')) pokaz(shagN === 4 ? 3 : shagN - 1); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, v = function (id, x) { if (!prov(id, x)) { if (ok) { var el = f.querySelector('#zk-' + id + ', [name=' + id + ']'); el && el.focus(); } ok = false; } };
      if (shagN === 1) { if (z.tip !== 'sam') { v('adres', z.adres.trim().length > 4); z.den = z.den || dni[0].toISOString().slice(0, 10); } if (ok) pokaz(2); }
      else if (shagN === 2) { v('imya', z.imya.trim().length > 1); v('tel', T.telOk(z.tel)); v('pochta', !z.pochta.trim() || T.pochtaOk(z.pochta)); if (ok) pokaz(3); }
      else if (shagN === 3) {
        if (z.na === 'komp') { v('inn', T.innOk(z.inn)); v('komp', z.komp.trim().length > 1); }
        v('sogl', f.querySelector('[name=sogl]').checked);
        if (!ok) return;
        if (z.oplata === 'karta') pokaz(4); else oformit();
      } else if (shagN === 4) {
        var kn = f.querySelector('#zk-kn').value.replace(/\D/g, '');
        v('kn', kn.length === 16); v('kv', f.querySelector('#zk-kv').value.trim().length > 1);
        v('ks', /^(0[1-9]|1[0-2])\/\d\d$/.test(f.querySelector('#zk-ks').value)); v('cvc', /^\d{3}$/.test(f.querySelector('#zk-cvc').value));
        if (ok) { z.karta = kn.slice(-4); pokaz(5); }
      }
    });
    pokaz(1);
  }
  API.zakaz = zakaz;

  /* ---------- мои покупки ---------- */
  function pokupki(box) {
    function risovat() {
      var sp = T.st.get(KZ) || [];
      if (!sp.length) {
        box.innerHTML = '<div class="lv-pusto lv-pusto-bol"><b>Покупок пока нет</b><p class="muted">Здесь появятся заказы из Лавки: статус, сборка и до какого числа товар ждёт на складе.</p>' +
          '<a class="btn" href="' + R + '../novyy/lavka/">Открыть Лавку</a></div>';
        return;
      }
      box.innerHTML = sp.map(function (o, j) {
        var st = STATUSY[o.tip === 'sam' ? 'sam' : 'dost'];
        return '<article class="pk kart"><div class="pk-verh"><div><h2 class="h3">Заказ № ' + o.n + '</h2><p class="muted">от ' + data(o.t) + ' · ' + TIPY[o.tip] + ' · ' + OPL[o.oplata].toLowerCase() + '</p></div>' +
          '<span class="pk-st' + (o.status >= 3 ? ' pk-st-ok' : '') + '">' + st[o.status] + '</span></div>' +
          '<div class="zk-status">' + st.map(function (x, i) { return '<span class="' + (i < o.status ? 'done' : i === o.status ? 'on' : '') + '">' + x + '</span>'; }).join('') + '</div>' +
          '<ul class="pk-poz">' + o.poz.map(function (x) {
            var t = PO_ID[x.id];
            return t ? '<li><span class="pk-il" style="background:' + tint(t) + '">' + upak(t) + '</span><span>' + esc(t.name) + '<small>' + esc(t.sel) + ' · ' + edN(t, x.u, x.q) + '</small></span><b>' + rub(summa(t, x.u, x.q)) + '</b></li>' : '';
          }).join('') + '</ul>' +
          '<div class="pk-niz"><p><b>' + rub(o.itog) + '</b> · ' + (o.status >= 3 ? 'забрано' : 'ждёт на складе до ' + data(o.t + 7 * 864e5)) + '</p>' +
          '<p class="cta-pol">' + (o.status < 3 ? '<button type="button" class="btn-t" data-demo="' + j + '">Демо: следующий статус</button>' : '') +
          '<button type="button" class="btn btn-2 btn-sm" data-povtor="' + j + '">Повторить заказ</button></p></div></article>';
      }).join('') +
        (T.sessiya() ? '<div class="banner-mir"><div><b>Забрать вместе с вашим товаром</b><p>Покупки лежат в том же ангаре, что и ваши паллеты. Закажите выдачу, и соберём всё к одному времени.</p></div>' +
          '<a class="btn btn-2 btn-sm" href="tel:+74956658242">Заказать выдачу</a></div>' : '');
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button'), sp = T.st.get(KZ) || [];
      if (!b) return;
      if (b.hasAttribute('data-demo')) {
        var o = sp[+b.getAttribute('data-demo')]; o.status = Math.min(3, o.status + 1); T.st.set(KZ, sp); risovat();
        T.toast('Статус: ' + STATUSY[o.tip === 'sam' ? 'sam' : 'dost'][o.status] + '. Отправили SMS');
      } else if (b.hasAttribute('data-povtor')) {
        sp[+b.getAttribute('data-povtor')].poz.forEach(function (x) { if (PO_ID[x.id]) dobavit(x.id, x.u, x.q); });
        T.toast('Положили в корзину тот же набор', { deystvie: 'Открыть корзину', onClick: function () { location.href = R + 'lavka/korzina/'; } });
      }
    });
    risovat();
  }
  API.pokupki = pokupki;

  /* ---------- Витрина: продавец собирает карточку и видит, как её увидят покупатели ---------- */
  var KAT_FORMA = { 'Продукты и напитки': ['pouch', 'ТОВАР'], 'Бытовая химия': ['kanistra', '5 л'], 'Дом и посуда': ['tarelki'], 'Упаковка': ['korob'],
    'Зоотовары': ['meshok', 'КОРМ'], 'Текстиль': ['stopka', 'ТОВАР'] };
  function cvetKat(k) { var t = D.tovary.filter(function (x) { return x.cat === k; })[0]; return t ? t.cvet : '#7C9CC0'; }
  function vitrina(box) {
    var v = { name: 'Сироп ванильный, 1 л', sel: 'Ваша компания', cat: 'Продукты и напитки', one: 390, box: 360, pal: 320, boxN: 6, palN: 480,
      vedenie: 'pomosh', polka: true };
    var a = T.sessiya() ? T.akk() : null;
    if (a && a.kompaniya) v.sel = a.kompaniya;
    box.innerHTML = '<div class="vt-g"><form class="kart vt-f" novalidate>' +
      '<div class="pole"><label for="vt-name">Товар</label><input id="vt-name" name="name" type="text" maxlength="70" value="' + esc(v.name) + '"><p class="osh-t">Как товар называется?</p></div>' +
      '<div class="pole"><label for="vt-cat">Категория</label><select id="vt-cat" name="cat">' + D.kategorii.map(function (k) { return '<option' + (k === v.cat ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select></div>' +
      '<fieldset class="pole"><legend>Лестница цен <span class="nb">за штуку, ₽</span></legend><div class="vt-ceny">' +
      [['one', 'Штучно'], ['box', 'Коробом'], ['pal', 'Паллетой']].map(function (x) {
        return '<label><span>' + x[1] + '</span><input name="' + x[0] + '" type="number" min="1" inputmode="numeric" value="' + v[x[0]] + '"></label>';
      }).join('') + '</div><p class="podskaz" data-lest-p>Чем больше берут, тем ниже цена за штуку: так покупатели и берут коробами</p></fieldset>' +
      '<div class="zk-dva"><div class="pole"><label for="vt-boxN">Штук в коробе</label><input id="vt-boxN" name="boxN" type="number" min="1" value="' + v.boxN + '"></div>' +
      '<div class="pole"><label for="vt-palN">Штук на паллете</label><input id="vt-palN" name="palN" type="number" min="1" value="' + v.palN + '"></div></div>' +
      '<label class="galka vt-polka"><input type="checkbox" name="polka" checked><span><b>Первая полка</b> · карточку видят первой в своей категории</span></label>' +
      '<fieldset class="pole"><legend>Кто ведёт витрину</legend><div class="zk-vary">' +
      var2('sam', 'Сами', 'входит в хранение: карточки и цены ведёте вы', '0 ₽') +
      var2('pomosh', 'С помощью', 'снимем товар на складе, напишем описания, поставим лестницу цен', 'от 4 900 ₽/мес') +
      var2('klyuch', 'Под ключ', 'ведём витрину целиком: карточки, цены, ответы покупателям', 'от 14 900 ₽/мес') + '</div></fieldset>' +
      '<button class="btn btn-bol" type="submit">Отправить на проверку</button>' +
      '<p class="muted kz-mel">Ни к чему не обязывает: сначала посмотрим товар и позвоним.</p></form>' +
      '<div class="vt-pr"><p class="eb">Так карточку увидят в Лавке</p><div data-pr></div>' +
      '<ul class="spis-ok vt-usl"><li>Хранение не меняется: плата за места прежняя</li><li>Сборку и отгрузку делаем мы</li><li>Выплата раз в неделю, по пятницам</li><li>Отказаться можно в любой момент</li></ul></div></div>';
    function var2(zn, zag, pod, c) {
      return '<label class="zk-var"><input type="radio" name="vedenie" value="' + zn + '"' + (zn === v.vedenie ? ' checked' : '') + '><span><b>' + zag + '</b><small>' + pod + '</small><em>' + c + '</em></span></label>';
    }
    var f = box.querySelector('form'), pr = box.querySelector('[data-pr]');
    function risovat() {
      var t = { id: 0, name: v.name || 'Ваш товар', sel: v.sel, cat: v.cat, badge: '', one: +v.one || 0, box: +v.box || 0, pal: +v.pal || 0,
        boxName: 'короб', boxN: +v.boxN || 1, palN: +v.palN || 1, mesto: 'ваше место на складе', cvet: cvetKat(v.cat), reyting: 5, forma: KAT_FORMA[v.cat] };
      pr.innerHTML = kartochka(t, { vitrina: v.polka, bezSsylki: true, bezKnopki: true });
      var lest = t.one >= t.box && t.box >= t.pal, p = f.querySelector('[data-lest-p]');
      p.textContent = lest ? 'Чем больше берут, тем ниже цена за штуку: так покупатели и берут коробами' : 'Цена коробом выше, чем за штуку: покупатель не поймёт, зачем брать больше';
      p.classList.toggle('vt-vnim', !lest);
    }
    f.addEventListener('input', function (e) { var t = e.target; if (t.name) v[t.name] = t.type === 'checkbox' ? t.checked : t.value; risovat(); });
    f.addEventListener('change', function (e) { var t = e.target; if (t.name) v[t.name] = t.type === 'checkbox' ? t.checked : t.value; risovat(); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var p = f.querySelector('#vt-name').closest('.pole'), ok = v.name.trim().length > 1;
      p.classList.toggle('osh', !ok);
      if (!ok) { f.querySelector('#vt-name').focus(); return; }
      var sp = T.st.get('tucha.vitrina') || []; sp.push(Object.assign({ t: Date.now() }, v)); T.st.set('tucha.vitrina', sp);
      T.goal('vitrina_zayavka');
      f.innerHTML = '<div class="gotovo"><b>Карточка на проверке</b>Пётр Ким посмотрит товар на складе и позвонит ' + kogdaZvonok() +
        ': проверит упаковку и маркировку, подскажет цену по рынку. После проверки карточка появится в Лавке.</div>' +
        '<p class="cta-pol"><a class="btn btn-2 btn-sm" href="' + R + '../novyy/lavka/">Посмотреть Лавку</a>' + (a ? '' : '<a class="btn btn-sm" href="' + R + '../novyy/start/">Начать работу со складом</a>') + '</p>';
    });
    risovat();
  }
  API.vitrina = vitrina;

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-lavka]').forEach(function (el) {
      var f = API[el.getAttribute('data-lavka')];
      if (f) f(el);
    });
  });
  API.upak = upak; API.kartochka = kartochka; API.korz = korz; API.PO_ID = PO_ID; API.rub = rub;
  return API;
})();
