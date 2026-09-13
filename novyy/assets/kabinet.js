/* Личный кабинет: данные одни, подача двух видов — простой и мир.
   Первый запуск: статус, персонаж, услуги, настройки. Заявки и документы
   видны, но открываются после договора. Кнопка «Демо: следующий статус»
   показывает, как кабинет меняется по ходу работы. */
(function () {
  var T = window.Tucha, S = window.TuchaScena, esc = window.TuchaReg.esc, R = T.ROOT;
  if (!T.sessiya()) { location.replace(R + 'vhod/'); return; }
  var a = T.akk();
  var STATUSY = ['Мир сохранён', 'Персонаж на связи', 'Готовим договор', 'Договор подписан', 'Товар под тучей'];
  var RAZDELY = [['glavnaya', 'Главная'], ['uslugi', 'Услуги'], ['pokupki', 'Покупки'], ['zayavki', 'Заявки'], ['dokumenty', 'Документы'], ['manager', 'Персонаж'], ['nastroyki', 'Настройки']];
  var DOST = { hranenie: 'Фундамент заложен', obrabotka: 'Своя мастерская', lavka: 'Место в Лавке', vitrina: 'Полка в Витрине',
    dostavka: 'Телепорт настроен', tamozhnya: 'Портал открыт', vse: 'Всё под одной тучей' };
  var PERS = { shturman: ['Штурман', 'Отвечаю быстро и по сути'], hranitel: ['Хранитель', 'Пришлю фото и отчёт по каждой поставке'],
    arhitektor: ['Архитектор', 'Посмотрю, где можно сэкономить'], pomoshnik: ['Помощник на сайте', 'Отвечу сразу, а сложное передам живому человеку'] };
  var KANALY = [['zvonok', 'Звонок'], ['pochta', 'Почта'], ['messenger', 'Мессенджер'], ['chat', 'Чат на сайте'], ['vstrecha', 'Встреча на складе']];
  var box = document.getElementById('kab'), menu = document.getElementById('kabMenu');
  var razdel = (location.hash || '').slice(1) || 'glavnaya';
  var novyy = (/[?&]novyy=(\w+)/.exec(location.search) || [])[1];
  if (!RAZDELY.some(function (r) { return r[0] === razdel; })) razdel = 'glavnaya';

  function sohr() { T.st.set('tucha.akk', a); }
  function mir() { return a.vid === 'mir'; }
  function uslugi() { return a.mir && a.mir.bloki ? S.PORYADOK.filter(function (k) { return a.mir.bloki[k]; }) : (a.uslugi || []); }
  function kanal() { return a.kanal || 'zvonok'; }
  /* в «Всё просто» на связи менеджер, в «Мире Тучи» персонаж */
  function ktoNaSvyazi() { return mir() ? 'персонаж' : 'менеджер'; }
  function statusy() { var s = STATUSY.slice(); if (!mir()) { s[0] = 'Заявка сохранена'; s[1] = 'Менеджер на связи'; } return s; }
  function pers() { return a.persona && PERS[a.persona] ? PERS[a.persona] : null; }

  function rMenu() {
    menu.innerHTML = RAZDELY.map(function (r) {
      var zam = (r[0] === 'zayavki' || r[0] === 'dokumenty') && (a.status || 0) < 3;
      var nazv = r[0] === 'manager' && !mir() ? 'Менеджер' : r[1];
      return '<button type="button" data-r="' + r[0] + '"' + (r[0] === razdel ? ' class="on" aria-current="page"' : '') + '>' + nazv +
        (zam ? '<small>после договора</small>' : '') + '</button>';
    }).join('');
  }
  function verh(h) {
    return '<div class="kab-verh"><div><h1 class="kab-h">' + h + '</h1><p class="muted">' + esc(a.kompaniya) + ' · ИНН ' + esc(a.inn) + '</p></div>' +
      '<div class="vid-pereklyuch" role="group" aria-label="Вид кабинета"><button type="button" data-vid="prosto"' + (mir() ? '' : ' class="on" aria-pressed="true"') + '>Простой</button>' +
      '<button type="button" data-vid="mir"' + (mir() ? ' class="on" aria-pressed="true"' : '') + '>Мир</button></div></div>';
  }
  function plashka() {
    if (!novyy) return '';
    var t = novyy === 'dostroil' ? 'Мир сохранён. Изменения уже видит ваш персонаж.' :
      mir() ? 'Ваш мир сохранён. Анна ' + T.kakSvyazhetsya(kanal(), a.messenger) + '.' :
      'Готово. Менеджер позвонит в рабочее время, пн-пт с 9:00 до 18:00.';
    return '<div class="plashka plashka-ok" role="status"><p>' + t + '</p></div>';
  }
  function rStatus() {
    var st = a.status || 0, sp = statusy();
    return '<div class="kart"><div class="razdel-h"><h2 class="h3">Статус</h2><span class="status-tek">' + sp[st] + '</span></div>' +
      '<div class="status">' + sp.map(function (x, i) { return '<div class="' + (i < st ? 'done' : i === st ? 'on' : '') + '">' + x + '</div>'; }).join('') + '</div>' +
      (st < 4 ? '<p class="demo-p"><button type="button" class="btn-t" data-demo-status>Демо: следующий статус</button></p>' : '') + '</div>';
  }
  function rManager(podrobno) {
    var p = pers(), st = a.status || 0;
    return '<div class="kart manager"><div class="m-verh"><span class="ava" aria-hidden="true">А</span><div><b>Анна</b><span class="muted">' +
      (p ? p[0] + ' · ' : '') + 'ваш ' + ktoNaSvyazi() + '</span></div></div>' +
      (p && podrobno ? '<p class="fraza">«' + p[1] + '»</p>' : '') +
      '<p>' + (st < 1 ? 'Анна ' + T.kakSvyazhetsya(kanal(), a.messenger) + '.' : 'На связи в рабочее время: пн-пт с 9:00 до 18:00.') + '</p>' +
      '<div class="m-kn"><a class="btn btn-2 btn-sm" href="tel:+74956658242" data-goal="call_click">Позвонить</a>' +
      '<a class="btn btn-2 btn-sm" href="https://t.me/tucha_ml">Написать в Telegram</a></div></div>';
  }
  function rPrigotovit() {
    return '<div class="kart"><h2 class="h3">Что приготовить к разговору</h2><ul class="spis-ok">' +
      '<li>Объём и тип товара: паллеты, коробки, вес</li><li>Даты первой поставки</li><li>Нужны ли маркировка, сборка и доставка</li></ul></div>';
  }
  function rUroven() {
    return '<div class="kart uroven-k"><h2 class="h3">Уровень</h2><p class="uroven"><b>Тучка</b></p>' +
      '<p class="muted" style="margin:0">Дальше Туча и Туча Макс, скоро.</p></div>';
  }
  function rDost() {
    var d = a.dost || (a.mir && a.mir.dost) || [];
    return '<div class="kart"><div class="razdel-h"><h2 class="h3">Достижения</h2><span class="muted">' + d.length + ' из 7</span></div><div class="ach">' +
      Object.keys(DOST).map(function (k) { return '<span class="' + (d.indexOf(k) >= 0 ? 'est' : '') + '">' + DOST[k] + '</span>'; }).join('') + '</div></div>';
  }

  var RENDER = {
    glavnaya: function () {
      var h = plashka() + verh(mir() ? 'Мой мир' : (a.imya ? 'Здравствуйте, ' + esc(a.imya) : 'Здравствуйте'));
      if (mir()) {
        h += '<div class="kab-mir"><div class="mir-scena kab-scena"><svg id="kabScena" role="img" aria-label="Ваш мир: постройка под тучей"></svg></div>' +
          '<div class="kab-kol">' + rStatus() + rUroven() + '</div></div><div class="setka s2 kab-niz">' + rManager() + rDost() + '</div>';
      } else {
        h += rStatus() + '<div class="setka s3 kab-niz">' + rManager() + rPrigotovit() + rUroven() + '</div>' +
          '<div class="banner-mir"><div><b>Попробуйте «Мир Тучи»</b><p>Другой формат: персонаж по характеру, услуги из блоков и бонусы за выполненные условия.</p></div>' +
          '<a class="btn btn-2 btn-sm" href="' + R + 'start/mir/?dostroit=1">Собрать</a></div>';
      }
      return h;
    },
    uslugi: function () {
      var u = uslugi(), vse = window.TuchaReg.USLUGI, net = vse.filter(function (x) { return u.indexOf(x[0]) < 0; });
      var h = verh('Услуги');
      h += '<div class="kart">' + (u.length ? u.map(function (k) {
        var B = S.BLOKI[k];
        return '<div class="usl-str"><span class="st-bl"><i class="cv" style="background:' + B.fill + '"></i><span><b>' + B.ig + '</b> · ' + B.ob + '</span></span>' +
          '<span class="muted">' + (B.skoro ? 'скоро: сообщим о запуске' : (a.status || 0) >= 3 ? 'в договоре' : 'обсудим при звонке') + '</span></div>';
      }).join('') : '<p class="pusto">Услуги пока не выбраны. Добавьте нужные: учтём их в договоре.</p>') + '</div>';
      if (mir()) h += '<p class="cta-pol"><a class="btn" href="' + R + 'start/mir/?dostroit=1">Достроить</a><span class="muted">Откроется конструктор с вашей постройкой</span></p>';
      else if (net.length) {
        h += '<div class="kart dobavit-usl"><h2 class="h3">Добавить услугу</h2><div class="vybor">' + net.map(function (x) {
          return '<label><input type="checkbox" name="nov-usl" value="' + x[0] + '"><span>' + x[1] + (x[2] ? ' <i class="skoro">скоро</i>' : '') + '</span></label>';
        }).join('') + '</div><p><button type="button" class="btn btn-sm" data-dob-usl>Добавить</button></p></div>';
      }
      return h;
    },
    pokupki: function () {
      return verh('Покупки в Лавке') + '<div data-pokupki-kab></div>';
    },
    zayavki: function () {
      var st = a.status || 0;
      return verh('Заявки') + '<div class="zamok"><b>' + (st < 3 ? 'Откроется после договора' : 'Заявок пока нет') + '</b><p>' +
        (st < 3 ? 'Заявок пока нет. Первая приёмка: после договора.' : 'Приёмку, отгрузку и доставку пока оформляем по телефону. Форма заявки появится здесь.') + '</p></div>' +
        '<div class="setka s3 zay-kn">' + [['Приёмка', 'Привезти товар на склад'], ['Отгрузка', 'Забрать или отправить товар'], ['Доставка', 'Отвезти по адресу']].map(function (x) {
          return '<div class="kart off" aria-disabled="true"><b>' + x[0] + '</b><p class="muted">' + x[1] + '</p></div>';
        }).join('') + '</div>';
    },
    dokumenty: function () {
      var st = a.status || 0;
      if (st < 2) return verh('Документы') + '<div class="zamok"><b>Откроется после договора</b><p>Документов пока нет. Договор появится здесь.</p></div>';
      return verh('Документы') + '<div class="kart"><div class="usl-str"><span><b>Договор ответственного хранения</b><br><span class="muted">' +
        (st < 3 ? 'Готовим: пришлём на подпись' : 'Подписан') + '</span></span><span class="muted">демо</span></div></div>' +
        '<p class="muted">Счета и акты появятся после первой приёмки.</p>';
    },
    manager: function () {
      return verh(mir() ? 'Персонаж' : 'Менеджер') + '<div class="setka s2">' + rManager(true) +
        '<div class="kart"><h2 class="h3">Чат</h2><p class="muted">Сейчас отвечает помощник, бот, не живой человек: сразу, днём и ночью. ' +
        (mir() ? 'Чат с вашим персонажем' : 'Чат с менеджером') + ' откроется после договора.</p><div data-chat-kab></div></div></div>';
    },
    nastroyki: function () {
      return verh('Настройки') + '<div class="setka s2">' +
        '<div class="kart"><h2 class="h3">Вид кабинета</h2><div class="vybor">' +
        '<label><input type="radio" name="vid" value="prosto"' + (mir() ? '' : ' checked') + '><span>Простой</span></label>' +
        '<label><input type="radio" name="vid" value="mir"' + (mir() ? ' checked' : '') + '><span>Мир</span></label></div>' +
        '<p class="muted">Данные те же, меняется только подача.</p></div>' +
        '<div class="kart"><h2 class="h3">Как с вами связаться</h2><div class="vybor">' + KANALY.map(function (x) {
          return '<label><input type="radio" name="kanal" value="' + x[0] + '"' + (kanal() === x[0] ? ' checked' : '') + '><span>' + x[1] + '</span></label>';
        }).join('') + '</div></div>' +
        '<div class="kart"><h2 class="h3">Доступ</h2><p>Сейчас в кабинет входит один человек, ' + esc(a.imya) + ', ' + esc(a.tel) + '.</p>' +
        '<p class="muted">Второму сотруднику доступ откроем по запросу.</p></div>' +
        '<div class="kart"><h2 class="h3">Выход</h2><p class="muted">Вход держится 30 дней на этом устройстве.</p>' +
        '<p class="cta-pol"><button type="button" class="btn btn-2 btn-sm" data-vyyti>Выйти</button>' +
        '<button type="button" class="btn-t" data-steret>Стереть демо-данные</button></p></div></div>';
    }
  };

  function pokaz(r) {
    razdel = r;
    try { history.replaceState(null, '', location.pathname + (novyy ? location.search : '') + '#' + r); } catch (e) {}
    rMenu();
    box.innerHTML = RENDER[r]();
    var ch = box.querySelector('[data-chat-kab]');
    if (ch && window.TuchaChat) TuchaChat.sozdat(ch, { vstroen: true });
    var pk = box.querySelector('[data-pokupki-kab]');
    if (pk && window.TuchaLavka) TuchaLavka.pokupki(pk);
    var svg = box.querySelector('#kabScena');
    if (svg) {
      var sc = S.sozdat(svg, { root: R }), bl = {}, opora = { obrabotka: 'hranenie', lavka: 'hranenie', vitrina: 'lavka' };
      uslugi().forEach(function (k) { var x = k; while (x) { bl[x] = 1; x = opora[x]; } });
      sc.obnovit(bl, false);
      sc.persona(a.persona || 'auto');
      sc.kanal(kanal());
    }
  }

  menu.addEventListener('click', function (e) {
    var b = e.target.closest('[data-r]');
    if (b) { novyy = null; pokaz(b.dataset.r); box.querySelector('h1').focus({ preventScroll: true }); }
  });
  box.addEventListener('click', function (e) {
    var t = e.target.closest('button');
    if (!t) return;
    var d = t.dataset;
    if (d.vid) { a.vid = d.vid; sohr(); pokaz(razdel); T.toast(d.vid === 'mir' ? 'Вид: мир' : 'Вид: простой'); }
    else if ('demoStatus' in d) {
      a.status = Math.min(4, (a.status || 0) + 1); sohr(); pokaz(razdel);
      T.toast('Статус: ' + statusy()[a.status] + (a.status > 0 ? '. Отправили вам сообщение' : ''));
    }
    else if ('dobUsl' in d) {
      var nov = Array.prototype.map.call(box.querySelectorAll('[name=nov-usl]:checked'), function (c) { return c.value; });
      if (!nov.length) { T.toast('Отметьте хотя бы одну услугу'); return; }
      a.uslugi = (a.uslugi || []).concat(nov);
      if (a.mir && a.mir.bloki) nov.forEach(function (k) { a.mir.bloki[k] = a.mir.bloki[k] || {}; });
      sohr(); pokaz('uslugi');
      T.toast(nov.length > 1 ? 'Услуги добавлены: учтём их в договоре' : 'Услуга добавлена: учтём её в договоре');
    }
    else if ('vyyti' in d) { T.vyyti(); location.href = R + 'vhod/'; }
    else if ('steret' in d) {
      ['tucha.akk', 'tucha.sessiya', 'tucha.mir', 'tucha.metki', 'tucha.list', 'tucha.kodpop', 'tucha.kodblok', 'tucha.kodpovt',
        'tucha.korzina', 'tucha.zakazy', 'tucha.vitrina'].forEach(T.st.del);
      location.href = R;
    }
  });
  box.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'vid') { a.vid = t.value; sohr(); T.toast(t.value === 'mir' ? 'Вид: мир' : 'Вид: простой'); }
    if (t.name === 'kanal') { a.kanal = t.value; sohr(); T.toast('Сохранено'); }
  });

  pokaz(razdel);
})();
