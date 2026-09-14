/* Личный кабинет: данные одни, подача двух видов — простой и мир.
   Первый запуск: статус, персонаж, услуги, настройки. Заявки и документы
   видны, но открываются после договора. Кнопка «Демо: следующий статус»
   показывает, как кабинет меняется по ходу работы. */
(function () {
  var T = window.Tucha, S = window.TuchaScena, esc = window.TuchaReg.esc, R = T.ROOT;
  if (!T.sessiya()) { location.replace(R + 'vhod/'); return; }
  var a = T.akk();
  var STATUSY = ['Мир сохранён', 'Персонаж на связи', 'Готовим договор', 'Договор подписан', 'Товар под тучей'];
  var RAZDELY = [['glavnaya', 'Главная'], ['urovni', 'Уровни'], ['uslugi', 'Услуги'], ['pokupki', 'Покупки'], ['zayavki', 'Заявки'], ['dokumenty', 'Документы'], ['manager', 'Персонаж'], ['nastroyki', 'Настройки']];
  var DOST = { hranenie: 'Фундамент заложен', obrabotka: 'Своя мастерская', vitrina: 'Полка в Витрине',
    dostavka: 'Телепорт настроен', tamozhnya: 'Портал открыт', vse: 'Всё под одной тучей' };
  var PERS = { shturman: ['Штурман', 'Отвечаю быстро и по сути'], hranitel: ['Хранитель', 'Расскажу подробно, что и почему'],
    arhitektor: ['Архитектор', 'Посмотрю, где можно сэкономить'], pomoshnik: ['Помощник на сайте', 'Отвечу сразу, а сложное передам живому человеку'] };
  var KANALY = [['zvonok', 'Звонок'], ['pochta', 'Почта'], ['messenger', 'Мессенджер'], ['chat', 'Чат на сайте'], ['vstrecha', 'Встреча на складе']];
  var box = document.getElementById('kab'), menu = document.getElementById('kabMenu');
  var razdel = (location.hash || '').slice(1) || 'glavnaya';
  var novyy = (/[?&]novyy=(\w+)/.exec(location.search) || [])[1];
  if (!RAZDELY.some(function (r) { return r[0] === razdel; })) razdel = 'glavnaya';

  function sohr() { T.st.set('tucha.akk', a); }
  function mir() { return a.vid === 'mir'; }
  function uslugi() { return a.mir && a.mir.bloki ? S.PORYADOK.filter(function (k) { return a.mir.bloki[k]; }) : (a.uslugi || []).filter(function (k) { return S.BLOKI[k]; }); }
  function kanal() { return a.kanal || 'zvonok'; }
  /* в «Всё просто» на связи менеджер, в «Мире Тучи» персонаж */
  function ktoNaSvyazi() { return mir() ? 'персонаж' : 'менеджер'; }
  function statusy() { var s = STATUSY.slice(); if (!mir()) { s[0] = 'Заявка сохранена'; s[1] = 'Менеджер на связи'; } return s; }
  function pers() { return a.persona && PERS[a.persona] ? PERS[a.persona] : null; }

  function rMenu() {
    menu.innerHTML = RAZDELY.filter(function (r) { return r[0] !== 'urovni' || mir(); }).map(function (r) {
      var zam = (r[0] === 'zayavki' || r[0] === 'dokumenty') && (a.status || 0) < 3;
      var nazv = r[0] === 'manager' && !mir() ? 'Менеджер' : r[1];
      return '<button type="button" data-r="' + r[0] + '"' + (r[0] === razdel ? ' class="on" aria-current="page"' : '') + '>' + nazv +
        (zam ? '<small>после договора</small>' : '') + '</button>';
    }).join('');
  }
  function verh(h) {
    return '<div class="kab-verh"><div><h1 class="kab-h">' + h + '</h1><p class="muted">' + (a.tip === 'fl' ? 'Частное лицо · ' + esc(a.imya || a.tel) : esc(a.kompaniya) + ' · ИНН ' + esc(a.inn)) + '</p></div>' +
      '<div class="vid-pereklyuch" role="group" aria-label="Вид кабинета"><button type="button" data-vid="prosto"' + (mir() ? '' : ' class="on" aria-pressed="true"') + '>Простой</button>' +
      '<button type="button" data-vid="mir"' + (mir() ? ' class="on" aria-pressed="true"' : '') + '>Мир</button></div></div>';
  }
  function plashka() {
    if (!novyy) return '';
    var t = novyy === 'dostroil' ? 'Мир сохранён. Изменения уже видит ваш персонаж.' :
      mir() ? 'Ваш мир сохранён. ' + imya() + ' ' + T.kakSvyazhetsya(kanal(), a.messenger) + '.' :
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
    return '<div class="kart manager"><div class="m-verh"><span class="ava" aria-hidden="true">' + imya()[0] + '</span><div><b>' + imya() + '</b><span class="muted">' +
      (p ? p[0] + ' · ' : '') + 'ваш ' + ktoNaSvyazi() + '</span></div></div>' +
      (p && (podrobno || mir()) ? '<p class="fraza">«' + p[1] + '»</p>' : '') +
      '<p>' + (st < 1 ? imya() + ' ' + T.kakSvyazhetsya(kanal(), a.messenger) + '.' : 'На связи в рабочее время: пн-пт с 9:00 до 18:00.') + '</p>' +
      '<div class="m-kn"><a class="btn btn-2 btn-sm" href="tel:+74956658242" data-goal="call_click">Позвонить</a>' +
      '<a class="btn btn-2 btn-sm" href="https://t.me/tucha_ml">Написать в Telegram</a></div>' +
      (mir() && !podrobno ? '<p class="smena-str"><button type="button" class="btn-t" data-idi="manager">Не сошлись характерами? Сменить персонажа</button></p>' : '') + '</div>';
  }
  function imya() { return a.manager || 'Анна'; }
  /* смена персонажа в «Мире Тучи»: собрать другого по характеру и полу, постройка и история остаются */
  var IMENA = { zh: ['Анна', 'Мария', 'Ольга'], m: ['Олег', 'Дмитрий', 'Игорь'] };
  var HARAKTER = [['shturman', 'Штурман', 'коротко и по делу'], ['hranitel', 'Хранитель', 'подробно, всё объясняет'], ['arhitektor', 'Архитектор', 'сам предложит, как выгоднее']];
  function rSmena() {
    var kr = a.kriterii || (a.mir && a.mir.kriterii) || {};
    return '<div class="kart smena"><h2 class="h3">Сменить персонажа</h2>' +
      '<p class="muted">Не сошлись характерами? Соберите другого. Постройка, заявки и история останутся.</p>' +
      '<fieldset class="pole"><legend>Характер общения</legend><div class="vybor">' + HARAKTER.map(function (x) {
        return '<label><input type="radio" name="sm-harakter" value="' + x[0] + '"' + ((a.persona || '') === x[0] ? ' checked' : '') + '><span><b>' + x[1] + '</b>: ' + x[2] + '</span></label>';
      }).join('') + '</div></fieldset>' +
      '<fieldset class="pole"><legend>Пол</legend><div class="vybor">' + [['nevazhno', 'Неважно'], ['zh', 'Женский'], ['m', 'Мужской']].map(function (x) {
        return '<label><input type="radio" name="sm-pol" value="' + x[0] + '"' + ((kr.pol || 'nevazhno') === x[0] ? ' checked' : '') + '><span>' + x[1] + '</span></label>';
      }).join('') + '</div></fieldset>' +
      '<p><button type="button" class="btn btn-sm" data-smenit>Сменить персонажа</button></p></div>';
  }
  function smenit() {
    var h = box.querySelector('[name=sm-harakter]:checked'), pl = box.querySelector('[name=sm-pol]:checked');
    var pol = pl ? pl.value : 'nevazhno', bylo = imya();
    if (!h) { T.toast('Выберите характер общения'); return; }
    var spisok = pol === 'm' ? IMENA.m : pol === 'zh' ? IMENA.zh : IMENA.zh.concat(IMENA.m);
    var nov = spisok.filter(function (x) { return x !== bylo; })[0];
    a.persona = h.value; a.manager = nov;
    a.kriterii = Object.assign({}, a.kriterii || {}, { harakter: h.value, pol: pol });
    if (a.mir) { a.mir.persona = h.value; a.mir.kriterii = Object.assign({}, a.mir.kriterii || {}, { harakter: h.value, pol: pol }); }
    sohr(); pokaz('manager');
    T.toast('Персонаж сменён: ' + nov + ', ' + PERS[h.value][0] + '. ' + nov + ' ' + T.kakSvyazhetsya(kanal(), a.messenger) + '.');
  }
  function rPrigotovit() {
    return '<div class="kart"><h2 class="h3">Что приготовить к разговору</h2><ul class="spis-ok">' +
      '<li>Объём и тип товара: паллеты, коробки, вес</li><li>Даты первой поставки</li><li>Нужны ли маркировка, сборка и доставка</li></ul></div>';
  }
  /* во «Всё просто» тарифов и уровней нет, есть скидка за срок */
  var SROK = [[1, '−15 %'], [3, '−20 %'], [6, '−30 %'], [12, '−40 %']];
  function srok() { return (a.mir && a.mir.bloki && a.mir.bloki.hranenie && a.mir.bloki.hranenie.srok) || 0; }
  function rSkidka() {
    var s = srok();
    return '<div class="kart uroven-k"><div class="razdel-h"><h2 class="h3">Скидка за срок</h2><span class="muted">' + (s ? 'резервация на ' + s + ' ' + mes(s) : 'сейчас по факту') + '</span></div>' +
      '<table class="kp-tabl"><caption class="skryt">«Займи место под Тучей»: скидка за резервацию мест</caption><tbody>' + SROK.map(function (x) {
        return '<tr' + (x[0] === s ? ' class="on"' : '') + '><td>' + x[0] + ' ' + mes(x[0]) + '</td><td>' + x[1] + '</td></tr>';
      }).join('') + '</tbody></table><p class="muted kp-mel">«Займи место под Тучей»: места и цена за вами, оплата вперёд.</p></div>';
  }

  /* «Всё просто»: обычный кабинет склада. Сводка, быстрые действия, ход подключения, менеджер */
  function rSvodka() {
    var st = a.status || 0, sp = statusy(), u = uslugi(), pal = a.mir && a.mir.bloki && a.mir.bloki.hranenie && a.mir.bloki.hranenie.pallety;
    var ya = [
      ['Статус', sp[st], 'шаг ' + (st + 1) + ' из ' + sp.length],
      ['Услуги', u.length ? u.length + ' ' + (u.length === 1 ? 'услуга' : u.length < 5 ? 'услуги' : 'услуг') : 'не выбраны', u.map(function (k) { return S.BLOKI[k].ob; }).join(', ') || 'добавьте в разделе «Услуги»'],
      ['Места на складе', st >= 4 && pal ? pal : 'пока нет', st >= 4 && pal ? 'паллето-мест занято' : 'после первой приёмки'],
      ['Менеджер', imya(), 'пн-пт с 9:00 до 18:00']
    ];
    return '<div class="kp-svodka">' + ya.map(function (y) {
      return '<div><span class="kp-z">' + y[0] + '</span><b>' + esc(String(y[1])) + '</b><span class="muted">' + esc(y[2]) + '</span></div>';
    }).join('') + '</div>';
  }
  var DEYSTVIYA = [['Заявить приёмку', 'привезти товар на склад', 'zayavki'], ['Заказать отгрузку', 'забрать или отправить товар', 'zayavki'],
    ['Заказать доставку', 'отвезти по адресу', 'zayavki'], ['Документы', 'договор, счета и акты', 'dokumenty']];
  function rDeystviya() {
    var zakr = (a.status || 0) < 3;
    return '<div class="kp-deystviya">' + DEYSTVIYA.map(function (d) {
      return '<button type="button" class="kp-d" data-idi="' + d[2] + '"><b>' + d[0] + '</b><span>' + (zakr ? 'после договора' : d[1]) + '</span></button>';
    }).join('') + '</div>';
  }

  /* «Мир Тучи»: полоса уровня, как в игре. Щит с номером, шкала пути до следующего уровня, стаж и достижения */
  function rHud() {
    var i = T.klubUroven(a.staj), u = T.KLUB[i], sl = T.KLUB[i + 1], staj = a.staj || 0, d = dost();
    var dolya = sl ? Math.max(0, Math.min(1, (staj - u.mes) / (sl.mes - u.mes))) : 1, ost = sl ? sl.mes - staj : 0;
    return '<div class="km-hud uroven-k">' +
      '<div class="km-znak" aria-hidden="true"><b>' + (i + 1) + '</b></div>' +
      '<div class="km-ur"><span class="km-z">Уровень ' + (i + 1) + ' из ' + T.KLUB.length + '</span><b class="km-imya">' + u.imya + '</b>' +
      '<div class="km-xp" role="progressbar" aria-label="Путь до следующего уровня" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(dolya * 100) + '">' +
      '<i style="width:' + (dolya * 100).toFixed(1) + '%"></i></div>' +
      '<span class="km-pod">' + (sl ? 'До «' + sl.imya + '»: ' + ost + ' ' + mes(ost) + ' с выполненными условиями' : 'Вершина «Мира Тучи»') + '</span></div>' +
      '<div class="km-schet"><span><b>' + staj + '</b>' + mes(staj) + ' стажа</span><span><b>' + d.length + '</b>из 6 достижений</span></div>' +
      (sl ? '<p class="km-demo"><button type="button" class="btn-t" data-demo-mes>Демо: месяц с выполненными условиями</button></p>' : '') + '</div>';
  }
  /* карта семи уровней: пройденные закрашены, текущий светится, следующие ждут */
  function rKartaUr() {
    var i = T.klubUroven(a.staj), sl = T.KLUB[i + 1];
    return '<div class="kart km-karta"><div class="razdel-h"><h2 class="h3">Карта уровней</h2><button type="button" class="btn-t" data-idi="urovni">Все уровни и привилегии</button></div>' +
      '<ol class="km-put">' + T.KLUB.map(function (u, k) {
        return '<li class="' + (k < i ? 'proyden' : k === i ? 'tek' : '') + '"' + (k === i ? ' aria-current="step"' : '') + '><i aria-hidden="true">' + (k < i ? '' : k + 1) + '</i>' +
          '<b>' + u.imya + '</b><span>' + (u.mes ? u.mes + ' мес' : 'старт') + '</span></li>';
      }).join('') + '</ol>' +
      (sl ? '<p class="muted km-usl">' + (fl() ? 'Условие' : 'Новые условия') + ' на уровне «' + sl.imya + '»: ' + usloviya(i + 1).map(sMaloy).join('; ') + '.</p>' : '') + '</div>';
  }
  function dost() { return a.dost || (a.mir && a.mir.dost) || []; }
  /* короткая цель на ближайшие недели: задание месяца, награда +1 месяц стажа, не больше половины пути */
  function rZadanie() {
    var z = T.zadanieMesyaca(), sd = a.zadanieSdano === new Date().getMonth();
    return '<div class="zadanie' + (z.sezon ? ' sezon' : '') + '"><b>' + (z.sezon ? 'Сезонное задание' : 'Задание месяца') + '</b><p>' + z.tekst + '</p>' +
      '<p class="zad-obmen">Вы получаете: ' + z.vam + ' и +1 месяц стажа</p>' +
      (sd ? '<p class="muted">Выполнено, стаж начислен</p>' : '') +
      (sd ? '' : '<p class="demo-p"><button type="button" class="btn-t" data-demo-zad>Демо: задание выполнено</button></p>') + '</div>';
  }
  function mes(n) { var m = n % 10, d = n % 100; return d > 10 && d < 20 ? 'месяцев' : m === 1 ? 'месяц' : m > 1 && m < 5 ? 'месяца' : 'месяцев'; }
  function li(x) { return '<li>' + x + '</li>'; }
  var PRAVILA_KLUB = ['Условия проверяем раз в месяц по фактам. Месяц засчитан, если выполнены все условия ступени. Где «одно из двух», хватает любого',
    'Частным лицам: одно условие на всех ступенях, оплата вовремя',
    'Сорвались: счётчик замирает, а не обнуляется', 'Пауза до 60 дней уровень не сбрасывает', 'Бесплатный период в стаж не идёт',
    'Скидка уровня не складывается с «Займи место под Тучей»: действует большая',
    '«Приведи под тучу»: за приведённого клиента 2 месяца стажа, но не больше половины пути до следующей ступени',
    'Отсрочка снимается при первой просрочке и возвращается через 3 месяца без просрочек',
    'Задание месяца: одно, необязательное, в пиковые месяцы сезонное. Награда +1 месяц стажа, ускорение не больше половины пути до следующего уровня',
    'Новый уровень: персонаж звонит и рассказывает, что открылось. Годовщина договора: звонок и итоги года',
    'Постройка в кабинете растёт вместе с уровнем: больше товара на площадке, больше туча, на «Мировой Туче» глобус'];
  /* момент перехода на уровень и годовщина договора: звонок персонажа, а не письмо */
  function plashkaUrovnya() {
    if (a.novyyUroven === undefined || a.novyyUroven === null) return '';
    var u = T.KLUB[a.novyyUroven];
    if (!u) return '';
    var god = a.godovshchina ? '<p><b>Год под Тучей.</b> ' + imya() + ' позвонит поздравить и подведёт итоги года: сколько дали привилегии уровня.</p>' : '';
    return '<div class="plashka plashka-ok plashka-ur" role="status"><p><b>Новый уровень: ' + u.imya + '.</b> ' + imya() +
      ' позвонит и расскажет, что теперь открыто: ' + u.daet.join(', ').toLowerCase() + '.</p>' + god +
      '<p class="muted">Знаете, кому ещё нужен склад? «Приведи под тучу»: за приведённого клиента 2 месяца стажа.</p>' +
      '<p><button type="button" class="btn-t" data-ur-ok>Понятно</button></p></div>';
  }
  function paket() { return a.paket || (a.mir && a.mir.bloki && a.mir.bloki.hranenie && a.mir.bloki.hranenie.biznes) || (fl() ? 'fl' : ''); }
  function fl() { return a.tip === 'fl'; }
  function usloviya(k) { return T.klubUsloviya(k, fl()); }
  function sMaloy(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
  function izmenitPostroyku() {
    return '<p class="cta-pol"><a class="btn" href="' + R + 'start/mir/?dostroit=1">Изменить постройку</a><span class="muted">Добавьте новые блоки или уберите лишние: откроется конструктор с вашей постройкой</span></p>';
  }
  function rDost() {
    var d = dost();
    return '<div class="kart km-dost"><div class="razdel-h"><h2 class="h3">Достижения</h2><span class="muted">' + d.length + ' из 6</span></div><div class="km-ach">' +
      Object.keys(DOST).map(function (k) {
        var est = d.indexOf(k) >= 0;
        return '<div class="km-a' + (est ? ' est' : '') + '">' + (k === 'vse' ? '<i class="km-a-zv" aria-hidden="true"></i>' : '<svg class="km-a-ik" data-ik="' + k + '" aria-hidden="true"></svg>') +
          '<span>' + DOST[k] + '</span>' + (est ? '' : '<small>ещё закрыто</small>') + '</div>';
      }).join('') + '</div>' +
      '<p class="smena-str"><a class="btn-t" href="' + R + 'start/mir/?dostroit=1">Изменить постройку: добавить или убрать блоки</a></p></div>';
  }

  var RENDER = {
    glavnaya: function () {
      var h = plashka() + (mir() ? plashkaUrovnya() : '') + verh(mir() ? 'Мой мир' : (a.imya ? 'Здравствуйте, ' + esc(a.imya) : 'Здравствуйте'));
      if (mir()) {
        var verhUr = T.KLUB[T.klubUroven(a.staj) + 1];
        h += rHud() + '<div class="kab-mir"><div class="mir-scena kab-scena"><svg id="kabScena" role="img" aria-label="Ваш мир: постройка под тучей"></svg></div>' +
          '<div class="kab-kol">' + (verhUr ? rZadanie() : '') + rStatus() + '</div></div>' + rKartaUr() +
          '<div class="setka s2 kab-niz">' + rManager() + rDost() + '</div>';
      } else {
        h += rSvodka() + rDeystviya() + '<div class="kp-g"><div>' + rStatus() + rPrigotovit() + '</div><div>' + rManager() + rSkidka() + '</div></div>' +
          '<p class="kp-mir">Нужен игровой формат? <a href="' + R + 'start/mir/?dostroit=1">Посмотреть «Мир Тучи»</a>: персонаж по характеру, услуги из блоков, семь уровней привилегий.</p>';
      }
      return h;
    },
    urovni: function () {
      if (!mir()) return RENDER.glavnaya();
      var i = T.klubUroven(a.staj), pk = paket();
      var h = verh('Уровни') + '<p class="muted">Семь ступеней «Мира Тучи». Уровень растёт за месяцы подряд с выполненными условиями, объём не важен. ' + (fl() ? 'Для частных лиц условие одно на всех ступенях: оплата вовремя.' : 'Условия копятся: на каждой ступени добавляются новые. Где условие «одно из двух», хватает любого.') + '</p>';
      h += '<div class="urovni-sp">' + T.KLUB.map(function (u, k) {
        return '<div class="kart urov' + (k === i ? ' tek' : k < i ? ' proyden' : '') + '"><div class="razdel-h"><h2 class="h3">' + (k + 1) + '. ' + u.imya + '</h2><span class="muted">' +
          (k === i ? 'ваш уровень · ' : '') + u.kogda + '</span></div>' +
          '<div class="urov-g"><div><b>Условия</b><ul class="spis-ok">' + usloviya(k).map(li).join('') + '</ul></div>' +
          '<div><b>Что даёт</b><ul class="spis-ok">' + u.daet.map(li).join('') + '</ul></div></div></div>';
      }).join('') + '</div>';
      h += '<div class="kart"><h2 class="h3">Пакет под ваш бизнес</h2><p class="muted">Работает с уровня «Туча». Выберите, что ближе.</p><div class="vybor paket-v">' +
        T.PAKETY.map(function (p) { return '<label><input type="radio" name="paket" value="' + p.k + '"' + (pk === p.k ? ' checked' : '') + '><span><b>' + p.imya + '</b> ' + p.daet + '</span></label>'; }).join('') + '</div></div>';
      h += '<div class="kart"><h2 class="h3">Правила</h2><ul class="spis-ok">' + PRAVILA_KLUB.map(li).join('') + '</ul></div>';
      return h;
    },
    uslugi: function () {
      var u = uslugi(), vse = window.TuchaReg.USLUGI, net = vse.filter(function (x) { return u.indexOf(x[0]) < 0; });
      var h = verh('Услуги');
      h += '<div class="kart">' + (u.length ? u.map(function (k) {
        var B = S.BLOKI[k];
        return '<div class="usl-str"><span class="st-bl"><i class="cv" style="background:' + B.fill + '"></i><span><b>' + B.ig + '</b> · ' + B.ob + '</span></span>' +
          '<span class="muted">' + ((a.status || 0) >= 3 ? 'в договоре' : 'обсудим при звонке') + '</span></div>';
      }).join('') : '<p class="pusto">Услуги пока не выбраны. Добавьте нужные: учтём их в договоре.</p>') + '</div>';
      if (mir()) h += izmenitPostroyku();
      else if (net.length) {
        h += '<div class="kart dobavit-usl"><h2 class="h3">Добавить услугу</h2><div class="vybor">' + net.map(function (x) {
          return '<label><input type="checkbox" name="nov-usl" value="' + x[0] + '"><span>' + x[1] + '</span></label>';
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
      return verh(mir() ? 'Персонаж' : 'Менеджер') + '<div class="setka s2">' + rManager(true) + (mir() ? rSmena() : '') +
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
    var obertka = box.closest('.kab');
    if (obertka) { obertka.classList.toggle('kab-vid-mir', mir()); obertka.classList.toggle('kab-vid-prosto', !mir()); }
    box.innerHTML = RENDER[r]();
    box.querySelectorAll('.km-a-ik[data-ik]').forEach(function (s) { S.ikonka(s, s.getAttribute('data-ik')); });
    var ch = box.querySelector('[data-chat-kab]');
    if (ch && window.TuchaChat) TuchaChat.sozdat(ch, { vstroen: true });
    var pk = box.querySelector('[data-pokupki-kab]');
    if (pk && window.TuchaLavka) TuchaLavka.pokupki(pk);
    var svg = box.querySelector('#kabScena');
    if (svg) {
      var sc = S.sozdat(svg, { root: R }), bl = {}, opora = { obrabotka: 'hranenie', vitrina: 'hranenie' };
      uslugi().forEach(function (k) { var x = k; while (x) { bl[x] = 1; x = opora[x]; } });
      sc.obnovit(bl, false);
      sc.persona(a.persona || 'auto');
      sc.kanal(kanal());
      if (mir() && sc.uroven) { var ui = T.klubUroven(a.staj); sc.uroven(ui, T.KLUB[ui].imya, T.KLUB.length, !!a.novyyUroven); }
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
    if (d.idi) { pokaz(d.idi); box.querySelector('h1').focus({ preventScroll: true }); }
    else if ('smenit' in d) smenit();
    else if ('demoZad' in d) {
      var b0 = T.klubUroven(a.staj), sl0 = T.KLUB[b0 + 1], pr = T.KLUB[b0];
      var polputi = sl0 ? Math.floor((sl0.mes - pr.mes) / 2) : 0, uzhe = a.uskorenie && a.uskorenie.ur === b0 ? a.uskorenie.n : 0;
      a.zadanieSdano = new Date().getMonth();
      if (sl0 && uzhe < Math.max(1, polputi)) {
        a.staj = Math.min(24, (a.staj || 0) + 1); a.uskorenie = { ur: b0, n: uzhe + 1 };
        var s1 = T.klubUroven(a.staj); a.novyyUroven = s1 > b0 ? s1 : a.novyyUroven;
        sohr(); pokaz(razdel); T.toast('Задание выполнено: +1 месяц стажа');
      } else { sohr(); pokaz(razdel); T.toast('Задание выполнено. Ускорение на этом уровне уже максимальное: половина пути'); }
    }
    else if ('urOk' in d) { a.novyyUroven = null; a.godovshchina = false; sohr(); pokaz(razdel); }
    else if ('demoMes' in d) {
      var bylo = T.klubUroven(a.staj);
      a.staj = Math.min(24, (a.staj || 0) + 1);
      var st = T.klubUroven(a.staj), sl = T.KLUB[st + 1];
      a.novyyUroven = st > bylo ? st : null; a.godovshchina = a.staj === 12 || a.staj === 24;
      if (a.godovshchina && a.novyyUroven === null) a.novyyUroven = st;
      sohr(); pokaz(razdel);
      T.toast(st > bylo ? 'Новый уровень: ' + T.KLUB[st].imya + '. ' + imya() + ' позвонит и расскажет о привилегиях.'
        : 'Месяц засчитан.' + (sl ? ' До уровня «' + sl.imya + '»: ' + (sl.mes - a.staj) + ' ' + mes(sl.mes - a.staj) + '.' : ''));
    }
    else if (d.vid) { a.vid = d.vid; sohr(); pokaz(razdel); T.toast(d.vid === 'mir' ? 'Вид: мир' : 'Вид: простой'); }
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
    if (t.name === 'paket') { a.paket = t.value; sohr(); T.toast('Пакет выбран: учтём с уровня «Туча»'); }
  });

  pokaz(razdel);
})();
