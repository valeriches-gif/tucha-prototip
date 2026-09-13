/* «Мир Тучи» — регистрация в формате игры.
   Пять уровней: Персонаж · Связь · Постройка · Бонус · Карта. Слева сцена
   с мальчиком-проводником, справа вопросы уровня. За блоки открываются
   достижения, бонус-уровень появляется, только если положен.
   Ответы сохраняются в браузере после каждого действия, регистрация — в конце. */
(function () {
  var T = window.Tucha, S = window.TuchaScena, Reg = window.TuchaReg, R = T.ROOT, esc = Reg.esc;
  var KEY = 'tucha.mir', STAVKA = 16.42;
  var SKIDKA = { 0: 0, 1: 15, 2: 20, 3: 30 };
  var UROVNI = ['', 'Персонаж', 'Связь', 'Постройка', 'Бонус', 'Карта'];
  var PERS = {
    shturman: { ig: 'Штурман', pod: 'Коротко и по делу', fraza: 'Отвечаю быстро и по сути', st: [5, 2, 3] },
    hranitel: { ig: 'Хранитель', pod: 'Подробно, с фото и отчётами', fraza: 'Пришлю фото и отчёт по каждой поставке', st: [3, 5, 3] },
    arhitektor: { ig: 'Архитектор', pod: 'Сам предложит, как выгоднее', fraza: 'Посмотрю, где можно сэкономить', st: [3, 3, 5] },
    pomoshnik: { ig: 'Помощник на сайте', pod: 'Бот, не живой человек: отвечает сразу, днём и ночью', fraza: 'Отвечу сразу, а сложное передам живому человеку', st: [5, 3, 3], bot: true },
    auto: { ig: 'Неважно, назначьте сами', pod: 'Персонаж назначится автоматически', fraza: '', st: null }
  };
  var STATY = ['Скорость', 'Подробность', 'Экономия'];
  var KANALY = [['zvonok', 'Звонок'], ['pochta', 'Почта'], ['messenger', 'Мессенджер'], ['chat', 'Чат на сайте'], ['vstrecha', 'Встреча на складе']];
  var MESS = [['Telegram', 'Telegram'], ['WhatsApp', 'WhatsApp'], ['MAX', 'MAX']];
  var ZAYAVKI = [['kabinet', 'В личном кабинете'], ['messenger', 'Сообщением в мессенджер'], ['manager', 'Через персонажа']];
  var DOST = { hranenie: 'Фундамент заложен', obrabotka: 'Своя мастерская', lavka: 'Место в Лавке', vitrina: 'Полка в Витрине',
    dostavka: 'Телепорт настроен', tamozhnya: 'Портал открыт', vse: 'Всё под одной тучей' };
  var ZAVISIT = { obrabotka: 'hranenie', lavka: 'hranenie', vitrina: 'lavka' };
  var IM = { obrabotka: 'Мастерская', lavka: 'Лавка', vitrina: 'Витрина' };
  var ROD = { hranenie: 'а', obrabotka: 'а', lavka: 'а', vitrina: 'а', dostavka: '', tamozhnya: '' };
  var OPS = [['priemka', 'Приёмка'], ['markirovka', 'Маркировка «Честный знак»'], ['sborka', 'Сборка заказов'], ['upakovka', 'Упаковка'], ['fbs', 'FBS на WB и Ozon']];
  var GDE = [['wb', 'Wildberries'], ['ozon', 'Ozon'], ['sayt', 'Свой сайт'], ['nigde', 'Пока нигде']];
  var KUDA = [['msk', 'Москва и область'], ['rf', 'Россия'], ['mir', 'За рубеж']];
  var VEDENIE = [['sam', 'Сами'], ['pomosh', 'С помощью'], ['klyuch', 'Под ключ']];
  var STRANY = ['Китай', 'Турция', 'Беларусь', 'Казахстан', 'Узбекистан', 'Киргизия', 'Армения', 'Индия', 'ОАЭ', 'Южная Корея',
    'Вьетнам', 'Германия', 'Италия', 'Польша', 'Иран', 'Таиланд', 'Индонезия', 'Египет'];
  var FRAZY = {
    hranenie: 'Фундамент на месте. Остальное можно ставить сверху.',
    obrabotka: 'Мастерская готова: приёмка, маркировка, сборка.',
    dostavka: 'Телепорт на месте, товар поедет куда нужно.',
    tamozhnya: 'Портал открыт: для грузов из-за рубежа.',
    lavka: 'Лавка открыта: товар продаётся прямо с полки, где лежит.',
    vitrina: 'Витрина стоит: ваш товар на первой полке Лавки.'
  };

  var svg = document.getElementById('scena'), panel = document.getElementById('panel'), hud = document.getElementById('hud');
  var rech = document.getElementById('rech'), pop = document.getElementById('dostPop'), ozv = document.getElementById('ozv');
  var sc = S.sozdat(svg, { root: R, naPrizemlenie: prygni });
  var dostroit = /[?&]dostroit/.test(location.search) && T.sessiya() && !!T.akk();
  var vozvrat = false, otkryt = null, prodolzhit = null, s;

  function nov() {
    return { v: 1, t: Date.now(), shag: 'intro', maks: 0, persona: null, kanal: 'zvonok', messenger: 'Telegram', kontakt: '',
      zayavki: 'kabinet', bloki: {}, pomosh: false, bonus: { hochu: null, tekst: '', fayl: '' }, bonusOtkryt: false, dost: [], done: false };
  }
  function defolt(k) {
    return { hranenie: { pallety: 10, neznayu: false, rezhim: 'teply', etap: null, srok: 0 }, obrabotka: { ops: [] },
      lavka: { gde: [], dostup: null }, vitrina: { gde: [], vedenie: null }, dostavka: { kuda: [] }, tamozhnya: { strana: '' } }[k];
  }
  function sohr() { s.t = Date.now(); T.st.set(KEY, s); }
  function tixo() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function nomer() { return typeof s.shag === 'number' ? s.shag : 0; }
  function rub(n) { return Math.round(n).toLocaleString('ru-RU') + ' ₽'; }
  function plural(n, a, b, c) { n = Math.abs(n) % 100; var m = n % 10; return n > 10 && n < 20 ? c : m === 1 ? a : m > 1 && m < 5 ? b : c; }
  function imena(spisok, vybor) { return spisok.filter(function (x) { return vybor.indexOf(x[0]) >= 0; }).map(function (x) { return x[1]; }).join(', '); }
  function cena() {
    var h = s.bloki.hranenie;
    if (!h || h.neznayu || !(+h.pallety > 0)) return 0;
    return +h.pallety * STAVKA * 30 * (1 - (SKIDKA[h.srok] || 0) / 100);
  }
  function bonusOk() { var h = s.bloki.hranenie; return !!(h && h.etap === 'start' && !h.neznayu && +h.pallety > 0 && +h.pallety <= 7); }
  function sled(n) { return n === 3 ? (bonusOk() ? 4 : 5) : n + 1; }
  function pred(n) { return n === 5 ? (bonusOk() ? 4 : 3) : n - 1; }

  /* ---------- проводник, достижения, счётчики ---------- */
  function govorit(t) {
    rech.textContent = t; rech.classList.remove('nov'); void rech.offsetWidth; rech.classList.add('nov');
    var m = document.getElementById('rechMob');
    if (m) m.textContent = t;
  }
  function ozvuchit(t) { ozv.textContent = ''; setTimeout(function () { ozv.textContent = t; }, 50); }
  function vsplyt(zag, t, kl) {
    var d = document.createElement('div');
    d.className = 'dost' + (kl ? ' ' + kl : '');
    d.innerHTML = '<i aria-hidden="true"></i><span><small>' + zag + '</small>' + t + '</span>';
    pop.appendChild(d);
    setTimeout(function () { d.classList.add('ushel'); }, 2800);
    setTimeout(function () { d.remove(); }, 3400);
  }
  function dostizhenie(k) {
    if (s.dost.indexOf(k) >= 0) return;
    s.dost.push(k); sohr();
    vsplyt('Достижение', DOST[k]);
    rHud();
  }
  function proverBonus() {
    var ok = bonusOk();
    if (ok && !s.bonusOtkryt) {
      s.bonusOtkryt = true; sohr();
      vsplyt('Открыт бонус-уровень', 'Первые полгода: за наш счёт', 'bonus');
      govorit('Вы только запускаетесь? Для вас открыт бонус-уровень.');
    } else if (!ok && s.bonusOtkryt) { s.bonusOtkryt = false; sohr(); }
    rHud();
  }
  function rHud() {
    var n = nomer();
    hud.hidden = !n;
    if (!n) return;
    var bl = Object.keys(s.bloki).length, c = cena();
    hud.innerHTML = '<ol class="hud-urovni" aria-label="Уровни">' + [1, 2, 3, 4, 5].map(function (k) {
      var kl = k === n ? 'on' : (k < n || (s.maks >= k && k !== 4)) ? 'done' : '';
      if (k === 4) kl = bonusOk() ? (k === n ? 'on' : (s.bonus.hochu !== null ? 'done' : 'otkryt')) : 'pusto';
      return '<li class="' + kl + '"' + (k === n ? ' aria-current="step"' : '') + '><span>' + (k === 4 ? 'Бонус' : 'Уровень ' + (k === 5 ? 4 + (bonusOk() ? 1 : 0) : k)) +
        '</span><b>' + UROVNI[k] + '</b></li>';
    }).join('') + '</ol><p class="hud-tek"><span>' + (n === 4 ? 'Бонус-уровень' : 'Уровень ' + (n === 5 && !bonusOk() ? 4 : n) + ' из ' + (bonusOk() ? 5 : 4)) +
      ' · </span>' + UROVNI[n] + '</p><div class="hud-schet"><span><b>' + bl + '</b>/6 блоков</span><span><b>' + s.dost.length + '</b>/7 достижений</span>' +
      (c ? '<span>≈ <b>' + rub(c) + '</b> в месяц</span>' : '') + '</div>';
  }
  function scenaLyudi(anim) {
    var n = nomer();
    sc.k = n >= 2 ? s.kanal : null;
    if (kritEst()) return sc.menedzher(sborka(), anim, imyaM());
    if (n > 1 || s.persona) return sc.persona(s.persona || 'auto');
    return sc.menedzher(null);
  }
  function prygni() {
    var m = document.getElementById('malchik');
    if (!m || tixo()) return;
    m.classList.remove('pryg'); void m.offsetWidth; m.classList.add('pryg');
  }

  /* ---------- уровни ---------- */
  function niz(n, o) {
    o = o || {};
    return '<div class="shag-niz">' +
      '<button type="button" class="btn-t" data-nazad>Назад</button>' +
      '<button type="button" class="btn" data-dalee' + (o.off ? ' disabled' : '') + '>' + (vozvrat ? 'Готово' : (o.dalee || 'Дальше')) + '</button>' +
      (dostroit ? '' : '<a class="btn-t prostoy" href="' + R + 'start/prosto/?iz=mir">Перейти в простой режим</a>') +
      (o.pod || '') + '</div>';
  }
  function zag(n, h, pod) {
    var nom = n === 4 ? 'Бонус-уровень' : 'Уровень ' + (n === 5 && !bonusOk() ? 4 : n) + ' из ' + (bonusOk() ? 5 : 4);
    return '<p class="eb">' + nom + '</p><h2 tabindex="-1">' + h + '</h2>' + (pod ? '<p class="muted">' + pod + '</p>' : '');
  }
  function radio(nm, spisok, tek) {
    return '<div class="vybor">' + spisok.map(function (x) {
      return '<label><input type="radio" name="' + nm + '" value="' + x[0] + '"' + (String(tek) === String(x[0]) ? ' checked' : '') + '><span>' + x[1] + '</span></label>';
    }).join('') + '</div>';
  }
  function galki(nm, spisok, tek) {
    return '<div class="vybor">' + spisok.map(function (x) {
      return '<label><input type="checkbox" name="' + nm + '" value="' + x[0] + '"' + ((tek || []).indexOf(x[0]) >= 0 ? ' checked' : '') + '><span>' + x[1] + '</span></label>';
    }).join('') + '</div>';
  }

  function rIntro() {
    panel.innerHTML = '<p class="eb">Мир Тучи · игра на пять минут</p>' +
      '<h1 class="mir-h" tabindex="-1">Постройте свой мир с Тучей</h1>' +
      '<p class="lead-m">Пять шагов: кто будет на связи, как удобнее общаться и какие услуги нужны. Регистрация: в самом конце.</p>' +
      '<ul class="fishki"><li><b>5</b>уровней</li><li><b>6</b>блоков</li><li><b>7</b>достижений</li></ul>' +
      (prodolzhit ? '<div class="plashka"><p>Продолжить строить? Вы остановились на уровне «' + UROVNI[prodolzhit] + '».</p>' +
        '<button type="button" class="btn btn-sm" data-prodolzhit>Продолжить</button><button type="button" class="btn-t" data-zanovo>Начать заново</button></div>' : '') +
      '<div class="cta-pol"><button type="button" class="btn"' + (prodolzhit ? ' data-zanovo-start' : ' data-start') + '>Начать строить</button>' +
      '<a class="btn-t" href="' + R + '../novyy/start/prosto/">Мне всё просто</a></div>';
  }

  var KRIT = [
    ['pol', 'Пол персонажа', [['nevazhno', 'Неважно'], ['zh', 'Женский'], ['m', 'Мужской']]],
    ['vozrast', 'Возраст', [['nevazhno', 'Неважно'], ['do30', 'до 30'], ['30-45', '30-45'], ['45+', 'старше 45']]],
    ['harakter', 'Характер общения', [['shturman', '<b>Штурман</b><small>Коротко и только по делу</small>'],
      ['hranitel', '<b>Хранитель</b><small>Подробно, с фото и отчётами</small>'],
      ['arhitektor', '<b>Архитектор</b><small>Сам предлагает, как сделать выгоднее</small>']]],
    ['format', 'Кто на связи', [['chelovek', 'Живой человек'], ['bot', 'Помощник-бот, отвечает сразу']]]
  ];
  var KRIT_TEKST = { zh: 'женщина', m: 'мужчина', do30: 'до 30 лет', '30-45': '30-45 лет', '45+': 'старше 45',
    shturman: 'коротко и по делу', hranitel: 'подробно, с фото и отчётами', arhitektor: 'ищет, где выгоднее', bot: 'бот, отвечает сразу' };
  var KRIT_FRAZY = {
    pol: 'Голова на месте: вот кто будет с вами на связи.',
    vozrast: 'Добавили деталь: так видно опыт.',
    harakter: 'Значок на груди показывает, как он работает.',
    chelovek: 'На связи будет живой человек.',
    bot: 'Помощник-бот отвечает сразу, днём и ночью.'
  };
  function znach(k) { var v = (s.kriterii || {})[k]; return v && v !== 'nevazhno' ? v : null; }
  function kritEst() { return !!(znach('pol') || znach('vozrast') || znach('harakter') || znach('format') === 'bot'); }
  function vyvesti() {
    if (znach('format') === 'bot') return 'pomoshnik';
    return znach('harakter') || (kritEst() ? 'auto' : null);
  }
  function opisKrit() {
    return ['pol', 'vozrast', 'harakter', 'format'].map(znach).filter(function (v) { return v && KRIT_TEKST[v]; })
      .map(function (v) { return KRIT_TEKST[v]; }).join(', ');
  }
  function imyaM() { var v = vyvesti(); return v ? S.PERS[v].ig : ''; }
  function sborka() { return { pol: znach('pol'), vozrast: znach('vozrast'), harakter: znach('harakter'), bot: znach('format') === 'bot' }; }
  function r1() {
    s.kriterii = s.kriterii || {};
    var h = zag(1, 'Какой персонаж вам подойдёт', 'Отметьте критерии, и персонаж соберётся из блоков у склада. Любой пункт можно оставить «неважно». Не сойдётесь характерами: персонажа можно сменить в кабинете.') +
      '<div class="krit">' + KRIT.map(function (g) {
        return '<fieldset class="pole krit-g krit-' + g[0] + '"><legend>' + g[1] + '</legend>' +
          radio('m-' + g[0], g[2], s.kriterii[g[0]] || (g[0] === 'format' ? 'chelovek' : 'nevazhno')) + '</fieldset>';
      }).join('') + '</div>' +
      '<div class="persona-inf" data-inf aria-live="polite">' + infPersony() + '</div>' +
      '<div class="chat-mir" data-chat-mir hidden></div>';
    panel.innerHTML = h + niz(1, { pod: '<p class="pomosh-str"><button type="button" class="btn-t" data-nevazhno>Неважно, подберите сами</button></p>' });
  }
  function infPersony() {
    if (!kritEst()) {
      return '<span class="ava ava-foto" aria-hidden="true"></span><div><small class="eb">Критерии не заданы: назначим по очереди</small>' +
        '<b>Любой из трёх</b><span class="muted">К клиентам выходят три персонажа. Отметьте критерии, покажем, кто подходит.</span></div>';
    }
    var v = vyvesti(), p = PERS[v];
    if (p.bot) {
      return '<span class="ava" aria-hidden="true">П</span><div><b>На связи: помощник-бот</b><span class="muted">' + opisKrit() + '</span>' +
        '<span class="muted">Это бот, не живой человек. К договору подключится ваш персонаж.</span>' +
        '<button type="button" class="btn-t" data-chat-probovat>Спросить помощника прямо сейчас</button></div>';
    }
    return '<span class="ava" aria-hidden="true">' + (v === 'auto' ? 'М' : p.ig[0]) + '</span><div><b>' +
      (v === 'auto' ? 'Подберём под критерии' : 'Подходит: ' + p.ig) + '</b><span class="muted">' + opisKrit() + '</span>' +
      (p.fraza ? '<span class="muted">«' + p.fraza + '»</span>' : '') + '</div>';
  }
  function r2() {
    var h = zag(2, 'Связь', 'Шаг можно пропустить: тогда позвоним, а заявки примем через кабинет.') +
      '<fieldset class="pole"><legend>Как с вами связаться?</legend>' + radio('kanal', KANALY, s.kanal) + '</fieldset>' +
      '<div data-mess' + (s.kanal === 'messenger' ? '' : ' hidden') + '><fieldset class="pole"><legend>Какой мессенджер</legend>' + radio('mess', MESS, s.messenger) + '</fieldset></div>' +
      '<div data-kontakt>' + poleKontakta() + '</div>' +
      '<fieldset class="pole"><legend>Как удобнее оставлять заявки?</legend>' + radio('zayavki', ZAYAVKI, s.zayavki) + '</fieldset>';
    panel.innerHTML = h + niz(2);
    var t = panel.querySelector('[name=kontakt][type=tel]'); if (t) T.maska(t);
  }
  function poleKontakta() {
    var k = s.kanal, tip = k === 'pochta' ? 'email' : (k === 'messenger' ? 'text' : 'tel');
    if (k === 'chat') {
      return '<p class="podskaz chat-pod">Чат с помощником откроется в кабинете и в углу сайта. Помощник: бот, не живой человек: ' +
        'отвечает сразу, днём и ночью. К договору подключится ваш персонаж. ' +
        '<button type="button" class="btn-t" data-chat-probovat>Попробовать</button></p><div class="chat-mir" data-chat-mir hidden></div>';
    }
    var lab = k === 'pochta' ? 'Почта' : (k === 'messenger' ? 'Телефон или ник' : 'Телефон');
    return '<div class="pole"><label for="m-kont">' + lab + ' <span class="nb">необязательно</span></label>' +
      '<input id="m-kont" name="kontakt" type="' + tip + '" value="' + esc(s.kontakt) + '" autocomplete="' + (tip === 'email' ? 'email' : 'tel') + '">' +
      '<p class="podskaz">Если оставите пустым, спросим при регистрации. До согласия храним только в вашем браузере.</p></div>';
  }

  function r3() {
    var pusto = !Object.keys(s.bloki).length;
    var h = zag(3, 'Постройка', (dostroit ? 'Добавьте новые блоки или уберите лишние: всё сохранится в кабинет.' : 'Нажмите на блок, он упадёт из тучи на место. Всё, что стоит сверху, опирается на склад. Блоки можно менять и потом, в кабинете.')) +
      '<div class="palitra" role="group" aria-label="Блоки услуг">' + S.PORYADOK.map(function (k) {
        var B = S.BLOKI[k], est = !!s.bloki[k];
        return '<button type="button" class="blok-k" data-k="' + k + '" aria-pressed="' + est + '" aria-label="' +
          (est ? B.ig + ', ' + B.ob + ', добавлен' + ROD[k] + '. Открыть карточку' : 'Добавить ' + (k === 'hranenie' ? 'Точку сохранения' : k === 'obrabotka' ? 'Мастерскую' : k === 'lavka' ? 'Лавку' : k === 'vitrina' ? 'Витрину' : B.ig) + ', ' + B.ob) + '">' +
          '<svg class="ik" data-ik="' + k + '" aria-hidden="true"></svg><span><b>' + B.ig + '</b><small>' + B.ob + '</small>' +
          '<em class="opora">' + ({ obrabotka: 'на Точку сохранения', lavka: 'на Точку сохранения', vitrina: 'на Лавку' }[k] || 'на земле') + '</em>' +
          '</span><span class="gal" aria-hidden="true"></span></button>';
      }).join('') + '</div><div id="kartochka"></div>';
    panel.innerHTML = h + niz(3, { off: pusto, pod: pusto ? '<p class="pomosh-str"><button type="button" class="btn-t" data-pomosh>Пока не знаю, помогите собрать</button></p>' : '' });
    rKarta();
    ikonkiIPeretaskivanie();
  }
  function ikonkiIPeretaskivanie() {
    panel.querySelectorAll('[data-ik]').forEach(function (sv) { S.ikonka(sv, sv.getAttribute('data-ik')); });
    if (!(window.matchMedia && matchMedia('(pointer: fine)').matches)) return;
    var stage = document.getElementById('stage');
    panel.querySelectorAll('.blok-k').forEach(function (b) {
      b.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        var k = b.dataset.k, x0 = e.clientX, y0 = e.clientY, ten = null;
        function nad(ev) { var r = stage.getBoundingClientRect(); return ev.clientX > r.left && ev.clientX < r.right && ev.clientY > r.top && ev.clientY < r.bottom; }
        function dvig(ev) {
          if (!ten && Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) > 10) {
            ten = document.createElement('div');
            ten.className = 'ten-bloka';
            ten.appendChild(b.querySelector('svg').cloneNode(true));
            document.body.appendChild(ten);
            stage.classList.add('priem');
          }
          if (ten) { ten.style.transform = 'translate(' + (ev.clientX - 44) + 'px,' + (ev.clientY - 44) + 'px)'; stage.classList.toggle('priem-nad', nad(ev)); }
        }
        function otpusk(ev) {
          document.removeEventListener('pointermove', dvig);
          document.removeEventListener('pointerup', otpusk);
          if (!ten) return;
          ten.remove();
          stage.classList.remove('priem', 'priem-nad');
          b.dataset.tyanuli = '1';
          setTimeout(function () { delete b.dataset.tyanuli; }, 80);
          if (nad(ev)) nazhat(k);
        }
        document.addEventListener('pointermove', dvig);
        document.addEventListener('pointerup', otpusk);
      });
    });
  }

  function teloKarty(k) {
    var b = s.bloki[k];
    if (k === 'hranenie') {
      var dis = b.neznayu ? ' disabled' : '';
      return '<div class="pole"><label for="k-pal">Сколько паллет</label><div class="polzunok">' +
        '<input type="range" name="pal-r" min="1" max="500" value="' + b.pallety + '" aria-label="Количество паллет"' + dis + '>' +
        '<input type="number" id="k-pal" name="pal" min="1" max="500" value="' + b.pallety + '"' + dis + '></div>' +
        '<label class="galka"><input type="checkbox" name="nez"' + (b.neznayu ? ' checked' : '') + '><span>Пока не знаю</span></label></div>' +
        '<fieldset class="pole"><legend>Режим</legend>' + radio('rezhim', [['teply', 'Тёплый'], ['holodny', 'Холодный'], ['nevazhno', 'Не важно']], b.rezhim) + '</fieldset>' +
        '<fieldset class="pole"><legend>Этап</legend>' + radio('etap', [['start', 'Только запускаемся'], ['rabotaem', 'Уже работаем']], b.etap) + '</fieldset>' +
        '<fieldset class="pole"><legend>Срок резервации <span class="nb">«Займи место под тучей»</span></legend>' +
        radio('srok', [[0, 'По факту'], [1, '1 мес · −15 %'], [2, '2 мес · −20 %'], [3, '3 мес и больше · −30 %']], b.srok) + '</fieldset>' +
        '<div class="raschet" data-raschet></div>';
    }
    if (k === 'obrabotka') return '<fieldset class="pole"><legend>Какие операции нужны <span class="nb">можно несколько</span></legend>' + galki('ops', OPS, b.ops) + '</fieldset>';
    if (k === 'lavka') return '<p class="podskaz">Покупатели берут товар прямо со склада: сборку и отгрузку делаем мы.</p>' +
      '<fieldset class="pole"><legend>Где продаёте сейчас</legend>' + galki('gde', GDE, b.gde) + '</fieldset>' +
      '<fieldset class="pole"><legend>Готовы дать доступ к кабинету маркетплейса?</legend>' + radio('dostup', [['da', 'Да'], ['net', 'Нет'], ['pozzhe', 'Позже']], b.dostup) + '</fieldset>';
    if (k === 'vitrina') return '<p class="podskaz">Место на первой полке Лавки: вашу карточку видят первой.</p>' +
      '<fieldset class="pole"><legend>Кто ведёт витрину</legend>' + radio('vedenie', VEDENIE, b.vedenie) + '</fieldset>' +
      '<fieldset class="pole"><legend>Где продаёте сейчас</legend>' + galki('gde', GDE, b.gde) + '</fieldset>';
    if (k === 'dostavka') return '<fieldset class="pole"><legend>Куда везём</legend>' + galki('kuda', KUDA, b.kuda) + '</fieldset>';
    return '<div class="pole"><label for="k-strana">Откуда или куда везёте</label><input id="k-strana" name="strana" type="text" list="strany" value="' + esc(b.strana) + '" placeholder="Страна">' +
      '<datalist id="strany">' + STRANY.map(function (x) { return '<option value="' + x + '">'; }).join('') + '</datalist></div>';
  }
  function rKarta() {
    var box = panel.querySelector('#kartochka');
    if (!box) return;
    var k = otkryt;
    if (!k || !s.bloki[k]) { box.innerHTML = ''; document.body.classList.remove('list-otkryt'); return; }
    var B = S.BLOKI[k];
    box.innerHTML = '<div class="list-fon" data-gotovo></div><div class="kartochka list" role="group" aria-label="' + B.ig + ', настройки">' +
      '<div class="k-verh"><i class="cv" style="background:' + B.fill + '"></i><h3>' + B.ig + ' · ' + B.ob + '</h3></div>' +
      '<button type="button" class="x" data-ubrat aria-label="Убрать блок ' + B.ig + '">×</button>' +
      '<div data-podtv></div>' + teloKarty(k) +
      '<div class="k-niz"><button type="button" class="btn btn-2 btn-sm" data-gotovo>Готово</button></div></div>';
    document.body.classList.add('list-otkryt');
    obnovitRaschet();
    var kt = box.querySelector('.kartochka'), y0 = null;
    kt.addEventListener('touchstart', function (e) { y0 = kt.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
    kt.addEventListener('touchend', function (e) {
      if (y0 !== null && e.changedTouches[0].clientY - y0 > 90) { otkryt = null; rKarta(); }
    });
  }
  function obnovitRaschet() {
    var r = panel.querySelector('[data-raschet]'), h = s.bloki.hranenie;
    if (!r || !h) return;
    r.innerHTML = h.neznayu ? 'Посчитаем вместе, когда станет ясен объём.' :
      'Примерно <b>' + rub(cena()) + '</b> в месяц<small>' + h.pallety + ' ' + plural(h.pallety, 'паллета', 'паллеты', 'паллет') +
      ' × 16,42 ₽ × 30 дней' + (SKIDKA[h.srok] ? ', скидка ' + SKIDKA[h.srok] + ' %' : '') + '. Точнее посчитаем при звонке</small>';
  }

  function r4() {
    var b = s.bonus;
    var h = zag(4, 'Для тех, кто запускается: первые полгода за наш счёт', 'Спецпредложение «Развитие». Условия:') +
      '<ul class="spis-ok"><li>Юрлицо или ИП на старте</li><li>Объём до 7 паллет или 7 000 кг</li><li>Бизнес-план в свободной форме</li>' +
      '<li>Договор не короче года</li><li>Отгрузки не больше 70 % от размещённого</li></ul>' +
      '<div class="pole"><label for="b-tekst">Расскажите о бизнесе <span class="nb">необязательно</span></label>' +
      '<textarea id="b-tekst" name="bonus-tekst" maxlength="2000">' + esc(b.tekst) + '</textarea>' +
      '<p class="podskaz">Что продаёте, где, какой объём через полгода · <span data-schet>' + b.tekst.length + '</span> / 2000</p></div>' +
      '<div class="pole"><label for="b-fayl">Бизнес-план <span class="nb">PDF или DOC до 10 МБ</span></label>' +
      '<input id="b-fayl" name="bonus-fayl" type="file" accept=".pdf,.doc,.docx">' +
      (b.fayl ? '<p class="podskaz">Выбран: ' + esc(b.fayl) + '. Сам файл отправим после регистрации</p>' : '') +
      '<p class="osh-t" data-fayl-osh>Файл больше 10 МБ, сожмите его или пришлите нам</p></div>' +
      '<div class="shag-niz"><button type="button" class="btn-t" data-nazad>Назад</button>' +
      '<button type="button" class="btn" data-bonus-da>' + (vozvrat ? 'Готово: хочу участвовать' : 'Хочу участвовать') + '</button>' +
      '<button type="button" class="btn-t" data-bonus-net>Пропустить</button></div>';
    panel.innerHTML = h;
  }

  function svodka(k) {
    var b = s.bloki[k];
    if (k === 'hranenie') return b.neznayu ? 'объём пока не знаю' : b.pallety + ' ' + plural(b.pallety, 'паллета', 'паллеты', 'паллет') + ' · ' +
      ({ teply: 'тёплый', holodny: 'холодный', nevazhno: 'режим не важен' }[b.rezhim] || '') + (b.srok ? ' · резерв ' + b.srok + (b.srok === 3 ? '+ мес' : ' мес') : ' · по факту') + (cena() ? ' · ≈ ' + rub(cena()) + ' в месяц' : '');
    if (k === 'obrabotka') return b.ops.length ? imena(OPS, b.ops) : 'операции обсудим';
    if (k === 'lavka') return b.gde && b.gde.length ? 'продаёте: ' + imena(GDE, b.gde) : 'площадки обсудим';
    if (k === 'vitrina') return (b.vedenie ? imena(VEDENIE, [b.vedenie]).toLowerCase() : 'ведение обсудим') + (b.gde && b.gde.length ? ' · продаёте: ' + imena(GDE, b.gde) : '');
    if (k === 'dostavka') return b.kuda.length ? imena(KUDA, b.kuda) : 'направление обсудим';
    return b.strana || 'страну обсудим';
  }
  function r5() {
    var p = PERS[s.persona || 'auto'], kan = imena(KANALY, [s.kanal]) + (s.kanal === 'messenger' ? ' · ' + s.messenger : '');
    var bloki = Object.keys(s.bloki);
    var stroki = [
      ['Персонаж', kritEst() ? (vyvesti() === 'auto' ? 'подберём под критерии' : PERS[vyvesti()].ig) + ': ' + opisKrit() : 'подберём сами', 1],
      ['Связь', kan + (s.kontakt ? ', ' + esc(s.kontakt) : '') + '. Заявки: ' + imena(ZAYAVKI, [s.zayavki]).toLowerCase(), 2],
      ['Постройка', bloki.length ? S.PORYADOK.filter(function (k) { return s.bloki[k]; }).map(function (k) {
        return '<span class="st-bl"><i class="cv" style="background:' + S.BLOKI[k].fill + '"></i><span><b>' + S.BLOKI[k].ig + '</b> · ' + esc(svodka(k)) + '</span></span>';
      }).join('') : 'Нужна помощь: соберём вместе при звонке', 3]
    ];
    if (!bonusOk()) stroki.push(['Стартовый бонус', 'не подходит по условиям: нужен этап «только запускаемся» и до 7 паллет', 3]);
    if (bonusOk()) stroki.push(['Стартовый бонус', s.bonus.hochu ? 'Хочу участвовать' + (s.bonus.tekst ? ': «' + esc(s.bonus.tekst.slice(0, 90)) + (s.bonus.tekst.length > 90 ? '…' : '') + '»' : '') : 'Пропущен', 4]);
    panel.innerHTML = zag(5, 'Карта вашего мира', 'Проверьте: любой уровень можно поправить.') +
      '<div class="karta-mira">' + stroki.map(function (x) {
        return '<div class="karta-str"><div><b>' + x[0] + '</b><div class="kz">' + x[1] + '</div></div>' +
          '<button type="button" class="btn-t" data-izm="' + x[2] + '">Изменить</button></div>';
      }).join('') + '</div>' +
      '<div class="shag-niz"><button type="button" class="btn-t" data-nazad>Назад</button>' +
      '<button type="button" class="btn" data-sohr>' + (dostroit ? 'Сохранить в кабинет' : 'Сохранить мой мир') + '</button></div>' +
      '<div id="reg" class="reg-blok" hidden></div>';
  }

  /* ---------- действия ---------- */
  function pokaz(n, tiho) {
    if (n === 4 && !bonusOk()) n = 5;
    s.shag = n;
    if (typeof n === 'number') s.maks = Math.max(s.maks || 0, n);
    if (n !== 3) otkryt = null;
    document.body.classList.remove('list-otkryt');
    sohr();
    try { history.replaceState(null, '', location.pathname + (n === 'intro' ? '' : '#shag-' + n)); } catch (e) {}
    scenaLyudi();
    sc.podpisi(typeof n === 'number' && n >= 3);
    rHud();
    ({ intro: rIntro, 1: r1, 2: r2, 3: r3, 4: r4, 5: r5 })[n]();
    panel.classList.remove('smena'); void panel.offsetWidth; panel.classList.add('smena');
    govorit(frazaShaga(n));
    if (!tiho) {
      var h = panel.querySelector('h1, h2');
      if (h) h.focus({ preventScroll: true });
      if (window.innerWidth < 900) window.scrollTo({ top: 0, behavior: tixo() ? 'auto' : 'smooth' });
    }
  }
  function frazaShaga(n) {
    if (n === 'intro') return 'Привет! Я проводник. Выберем, кто будет на связи, и соберём склад из блоков.';
    if (n === 1) return 'Соберём персонажа из блоков: каждый ответ добавляет деталь.';
    if (n === 2) return 'Как вам удобнее общаться? От тучи к персонажу протянется связь.';
    if (n === 3) return dostroit ? 'Меняйте постройку: новый блок нажатием, лишний убирается крестиком в карточке.' : Object.keys(s.bloki).length ? 'Нажмите на блок, чтобы добавить его или открыть карточку.' : 'Нажмите на блок, он упадёт на место.';
    if (n === 4) return 'Вы только запускаетесь, для вас открыт бонус-уровень.';
    return dostroit ? 'Вот ваш мир. Сохраним изменения в кабинет?' : 'Вот ваш мир. Проверьте и сохраните, это последний шаг.';
  }
  var PROYDEN = { 1: 'Персонаж выбран', 2: 'Связь настроена', 3: 'Постройка готова', 4: 'Бонус учтён' };
  function dalee(n) {
    T.goal('mir_step_' + n);
    if (!vozvrat && PROYDEN[n]) vsplyt('Уровень пройден', PROYDEN[n], 'uroven');
    if (vozvrat) { vozvrat = false; pokaz(5); return; }
    pokaz(sled(n));
  }
  function cepochka(k) { var c = [], x = k; while (x) { c.unshift(x); x = ZAVISIT[x]; } return c; }
  function nazhat(k) {
    if (s.bloki[k]) { otkryt = k; r3(); fokusBloka(k); return; }
    var novye = cepochka(k).filter(function (x) { return !s.bloki[x]; });
    novye.forEach(function (x) { s.bloki[x] = defolt(x); });
    otkryt = k; sohr();
    if (novye.length > 1) govorit(k === 'vitrina' ? 'Витрина: это полка в Лавке. Поставил фундамент и Лавку.' : S.BLOKI[k].ig + ' стоит на складе, поставил фундамент.');
    else govorit(FRAZY[k]);
    r3(); fokusBloka(k); rHud();
    sc.obnovit(s.bloki, true).then(function (upali) {
      upali.forEach(function (x) { T.goal('blok_add_' + x); dostizhenie(x); });
      if (upali.length) ozvuchit(upali.map(function (x) { return S.BLOKI[x].ig + ' добавлен' + ROD[x]; }).join('. '));
      if (Object.keys(s.bloki).length === 6) dostizhenie('vse');
      proverBonus();
    });
  }
  function fokusBloka(k) { var b = panel.querySelector('[data-k="' + k + '"]'); if (b && window.innerWidth >= 900) b.focus({ preventScroll: true }); }
  function zavisimye(k) {
    var r = [];
    Object.keys(ZAVISIT).forEach(function (x) { if (ZAVISIT[x] === k && s.bloki[x]) { r.push(x); r = r.concat(zavisimye(x)); } });
    return r;
  }
  function ubrat(k, podtv) {
    var z = zavisimye(k);
    if (z.length && !podtv) {
      var im = z.map(function (x) { return IM[x]; });
      panel.querySelector('[data-podtv]').innerHTML = '<div class="vopros-ub" role="alert"><p>На нём ' +
        (z.length > 1 ? 'стоят ' + im.slice(0, -1).join(', ') + ' и ' + im[im.length - 1] : 'стоит ' + im[0]) + '. Уберём всё вместе?</p>' +
        '<button type="button" class="btn btn-sm" data-da>Да, убрать</button> <button type="button" class="btn-t" data-net>Нет</button></div>';
      panel.querySelector('[data-da]').focus();
      return;
    }
    var bylo = JSON.parse(JSON.stringify(s.bloki));
    [k].concat(z).forEach(function (x) { delete s.bloki[x]; });
    otkryt = null; sohr();
    sc.obnovit(s.bloki, true);
    var txt = S.BLOKI[k].ig + ' убран' + ROD[k] + (z.length ? ' вместе с тем, что стояло сверху' : '');
    ozvuchit(txt);
    T.toast(txt, { deystvie: 'Вернуть', ms: 5000, onClick: function () {
      s.bloki = bylo; otkryt = k; sohr(); sc.obnovit(s.bloki, true); if (nomer() === 3) r3(); rHud(); proverBonus();
    } });
    govorit(frazaShaga(3));
    r3(); rHud(); proverBonus();
  }

  function sohranit() {
    if (dostroit) {
      var a = T.akk();
      a.mir = JSON.parse(JSON.stringify(s)); a.mir.done = true;
      a.uslugi = Object.keys(s.bloki); a.vid = 'mir'; a.persona = s.persona; a.kanal = s.kanal; a.messenger = s.messenger;
      a.dost = s.dost.slice();
      T.st.set('tucha.akk', a);
      s.done = true; sohr();
      final(true);
      return;
    }
    var box = panel.querySelector('#reg'), btn = panel.querySelector('[data-sohr]');
    btn.parentNode.hidden = true;
    box.hidden = false;
    var pred = {};
    if (s.kontakt) { if (/@/.test(s.kontakt)) pred.pochta = s.kontakt; else if (s.kontakt.replace(/\D/g, '').length >= 10) pred.tel = s.kontakt; }
    box.innerHTML = '<h3 class="reg-h">Сохранить мир: регистрация</h3><div data-forma></div>';
    Reg.forma(box.querySelector('[data-forma]'), {
      kratko: true, knopka: 'Сохранить мой мир',
      predzapolnit: pred,
      onOk: function (d) {
        var m = JSON.parse(JSON.stringify(s)); m.done = true;
        Reg.sozdatAkk(d, { put: 'mir', vid: 'mir', uslugi: Object.keys(s.bloki), mir: m, persona: s.persona,
          kanal: s.kanal, messenger: s.messenger, dost: s.dost.slice(), pomosh: s.pomosh });
        s.done = true; sohr();
        final(false);
      }
    });
    box.scrollIntoView({ behavior: tixo() ? 'auto' : 'smooth', block: 'start' });
    var f = box.querySelector('input'); if (f) f.focus({ preventScroll: true });
  }

  function final(vKabinet) {
    hud.hidden = true; rech.hidden = true; pop.innerHTML = '';
    document.body.classList.add('mir-final');
    panel.innerHTML = '<div class="final-t" tabindex="-1">' +
      '<img class="final-art" src="' + R + 'assets/img/provodnik-palec.webp" alt="Проводник показывает большой палец: мир сохранён" width="781" height="900">' +
      '<p class="eb">Уровень пройден</p><h2>Мир сохранён</h2>' +
      '<p>' + (vKabinet ? 'Изменения уже в кабинете, ваш персонаж их увидит.' : 'Анна ' + T.kakSvyazhetsya(s.kanal, s.messenger) + '.') + '</p>' +
      '<p class="muted">' + s.dost.length + ' из 7 достижений · ' + Object.keys(s.bloki).length + ' из 6 блоков</p>' +
      '<a class="btn" href="' + R + 'kabinet/?novyy=' + (vKabinet ? 'dostroil' : '1') + '">В кабинет</a></div>';
    panel.firstChild.focus({ preventScroll: true });
    if (window.innerWidth < 900) svg.scrollIntoView({ behavior: tixo() ? 'auto' : 'smooth', block: 'center' });
    sc.final('Всё под одной тучей', R + 'assets/img/koltso.png').then(function () {
      if (!tixo()) setTimeout(function () { location.href = R + 'kabinet/?novyy=' + (vKabinet ? 'dostroil' : '1'); }, 1500);
    });
  }

  /* ---------- события: одно делегирование на всю панель ---------- */
  panel.addEventListener('click', function (e) {
    var t = e.target.closest('button, [data-gotovo]');
    if (!t) return;
    var n = nomer(), d = t.dataset;
    if ('start' in d) { T.goal('mir_intro'); pokaz(1); }
    else if ('zanovoStart' in d || 'zanovo' in d) {
      s = nov(); T.st.del(KEY); prodolzhit = null; otkryt = null;
      sc.obnovit({}, false); scenaLyudi();
      if ('zanovoStart' in d) { T.goal('mir_intro'); pokaz(1); } else { pokaz('intro'); T.toast('Анкета очищена'); }
    }
    else if ('prodolzhit' in d) { var p = prodolzhit; prodolzhit = null; pokaz(p); }
    else if ('nazad' in d) { if (vozvrat) { vozvrat = false; pokaz(5); } else pokaz(n === 1 ? 'intro' : pred(n)); }
    else if ('dalee' in d) dalee(n);
    else if (d.p) {
      s.persona = d.p; sohr();
      panel.querySelectorAll('.persona').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.p === d.p); });
      var inf = panel.querySelector('[data-inf]'); inf.hidden = false; inf.innerHTML = infPersony();
      scenaLyudi(); sc.persona(d.p);
      govorit(d.p === 'auto' ? 'Хорошо, назначим сами. Персонаж встанет у постройки.' : PERS[d.p].ig + ' уже у постройки. Дальше: связь.');
    }
    else if ('chatProbovat' in d) {
      var cm = panel.querySelector('[data-chat-mir]');
      if (cm && window.TuchaChat) {
        if (!cm.dataset.gotov) { cm.dataset.gotov = 1; TuchaChat.sozdat(cm, { vstroen: true, fokus: true }); }
        cm.hidden = false; t.hidden = true;
        govorit('Спросите что угодно про склад, помощник ответит сразу.');
      }
    }
    else if (d.k) { if (!d.tyanuli) nazhat(d.k); }
    else if ('gotovo' in d) { var k = otkryt; otkryt = null; rKarta(); panel.querySelectorAll('.blok-k').forEach(function (b) { b.classList.toggle('otkryt', false); }); if (k) fokusBloka(k); }
    else if ('ubrat' in d) ubrat(otkryt);
    else if ('da' in d) ubrat(otkryt, true);
    else if ('net' in d) panel.querySelector('[data-podtv]').innerHTML = '';
    else if ('nevazhno' in d) { s.kriterii = {}; s.persona = 'auto'; sohr(); dalee(1); }
    else if ('pomosh' in d) { s.pomosh = true; sohr(); T.goal('pomosh'); dalee(3); }
    else if ('bonusDa' in d) { s.bonus.hochu = true; sohr(); T.goal('bonus_yes'); dalee(4); }
    else if ('bonusNet' in d) { s.bonus.hochu = false; sohr(); dalee(4); }
    else if (d.izm) { vozvrat = true; pokaz(+d.izm); }
    else if ('sohr' in d) sohranit();
  });

  function naPole(e) {
    var t = e.target, nm = t.name;
    if (!nm) return;
    if (nm === 'kanal') {
      s.kanal = t.value; sohr();
      panel.querySelector('[data-mess]').hidden = s.kanal !== 'messenger';
      panel.querySelector('[data-kontakt]').innerHTML = poleKontakta();
      var tel = panel.querySelector('[name=kontakt][type=tel]'); if (tel) T.maska(tel);
      sc.kanal(s.kanal);
      govorit({ zvonok: 'Позвоним: это быстрее всего.', pochta: 'Напишем письмо: удобно для документов.', messenger: 'Напишем в мессенджер.',
        chat: 'Чат на сайте: помощник ответит сразу, днём и ночью.', vstrecha: 'Встретимся на складе, покажем всё вживую.' }[s.kanal]);
    }
    else if (nm.indexOf('m-') === 0) {
      s.kriterii = s.kriterii || {};
      s.kriterii[nm.slice(2)] = t.value;
      s.persona = vyvesti(); sohr();
      var inf = panel.querySelector('[data-inf]'); inf.innerHTML = infPersony();
      scenaLyudi(true);
      if (t.value !== 'nevazhno') govorit(KRIT_FRAZY[nm === 'm-format' ? t.value : nm.slice(2)]);
    }
    else if (nm === 'mess') { s.messenger = t.value; sohr(); }
    else if (nm === 'kontakt') { s.kontakt = t.value; sohr(); }
    else if (nm === 'zayavki') { s.zayavki = t.value; sohr(); }
    else if (nm === 'bonus-tekst') { s.bonus.tekst = t.value; sohr(); panel.querySelector('[data-schet]').textContent = t.value.length; }
    else if (nm === 'bonus-fayl') {
      var f = t.files && t.files[0], osh = t.closest('.pole');
      if (f && f.size > 10 * 1024 * 1024) { osh.classList.add('osh'); t.value = ''; s.bonus.fayl = ''; }
      else { osh.classList.remove('osh'); s.bonus.fayl = f ? f.name : ''; }
      sohr();
    }
    else if (t.closest('.kartochka')) naPoleKarty(t, e.type);
  }
  function naPoleKarty(t, tip) {
    var b = s.bloki[otkryt], nm = t.name;
    if (!b) return;
    if (nm === 'pal-r') { b.pallety = +t.value; panel.querySelector('[name=pal]').value = t.value; }
    else if (nm === 'pal') {
      var v = parseInt(t.value, 10);
      if (v > 0) { b.pallety = Math.min(500, v); panel.querySelector('[name=pal-r]').value = b.pallety; }
      if (tip === 'change') t.value = b.pallety;
    }
    else if (nm === 'nez') {
      b.neznayu = t.checked;
      panel.querySelectorAll('[name=pal], [name=pal-r]').forEach(function (i) { i.disabled = t.checked; });
    }
    else if (nm === 'rezhim' || nm === 'etap' || nm === 'dostup' || nm === 'strana' || nm === 'vedenie') b[nm] = t.value;
    else if (nm === 'srok') b.srok = +t.value;
    else if (nm === 'ops' || nm === 'gde' || nm === 'kuda') {
      b[nm] = Array.prototype.map.call(panel.querySelectorAll('.kartochka [name=' + nm + ']:checked'), function (c) { return c.value; });
    }
    sohr(); obnovitRaschet();
    if (tip === 'change' || nm === 'pal-r' || nm === 'pal') proverBonus();
  }
  panel.addEventListener('input', naPole);
  panel.addEventListener('change', naPole);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && otkryt) { var k = otkryt; otkryt = null; rKarta(); fokusBloka(k); }
  });

  /* ---------- запуск ---------- */
  (function init() {
    var bylo = T.anketa();
    var q = /[?&]blok=(\w+)/.exec(location.search), pryamo = /[?&]prodolzhit/.test(location.search) || /#shag-\d/.test(location.hash);
    if (dostroit) {
      var a = T.akk();
      s = a.mir ? JSON.parse(JSON.stringify(a.mir)) : nov();
      s.done = false;
      (a.uslugi || []).forEach(function (k) { if (S.BLOKI[k] && !s.bloki[k]) s.bloki[k] = {}; });
      Object.keys(s.bloki).forEach(function (k) { s.bloki[k] = Object.assign(defolt(k), s.bloki[k]); });
      if (!a.mir) { s.persona = a.persona || null; s.kanal = a.kanal || 'zvonok'; }
      s.shag = 3; s.maks = 5;
    } else if (bylo && !bylo.done) {
      s = bylo;
      if (s.shag !== 'intro' && !pryamo && !q) prodolzhit = s.shag;
    } else s = nov();
    s.dost = s.dost || []; s.bonus = s.bonus || { hochu: null, tekst: '', fayl: '' };
    var metki = T.metki();
    if (q && S.BLOKI[q[1]]) metki.push(q[1]);
    metki.forEach(function (k) { cepochka(k).forEach(function (x) { if (!s.bloki[x]) s.bloki[x] = defolt(x); }); if (!otkryt) otkryt = k; });
    if (metki.length) { T.st.del('tucha.metki'); prodolzhit = null; }
    if (q) s.shag = 3;
    var h = /#shag-(\d)/.exec(location.hash);
    if (h && !q && !dostroit) s.shag = Math.min(+h[1], Math.max(1, s.maks || 1));
    sc.obnovit(s.bloki, false);
    /* блоки, выбранные на страницах услуг, тоже засчитываем — молча, без всплывашек */
    Object.keys(s.bloki).forEach(function (k) { if (s.dost.indexOf(k) < 0) s.dost.push(k); });
    if (Object.keys(s.bloki).length === 6 && s.dost.indexOf('vse') < 0) s.dost.push('vse');
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
    pokaz(prodolzhit ? 'intro' : s.shag, true);
    if (metki.length && s.shag === 'intro') govorit('Вы уже выбрали: ' + metki.map(function (k) { return S.BLOKI[k].ig; }).join(', ') + '. Этот блок уже стоит в постройке.');
  })();
})();
