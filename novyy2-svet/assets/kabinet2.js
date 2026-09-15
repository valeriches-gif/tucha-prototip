/* Кабинет Тучи для всех прототипов, кроме самого первого (/kabinet/, /v2/kabinet/, современная версия).
   Логика одна, подача двух видов: «Всё просто» — деловой кабинет, «Мир Тучи» — экран мира с постройками.
   Профили: компания и частное лицо («Вы входите как», как в первом прототипе).
   Разделы по смыслу: обзор · что лежит на складе · заявки · продажи на Витрине (компания) или покупки (частное лицо) ·
   документы и счета · менеджер или персонаж · настройки. В «Мире Тучи» заявки уходят так, как клиент выбрал в игре:
   в кабинете, сообщением в мессенджер или через персонажа. Данные демо живут в браузере. */
(function () {
  var T = window.Tucha, S = window.TuchaScena, esc = window.TuchaReg.esc, R = T.ROOT, L = window.TuchaLavka;
  if (!T.sessiya()) { location.replace(R + (T.v2() ? 'v2/' : '') + 'vhod/'); return; }
  var a = T.akk();
  var box = document.getElementById('kab'), menu = document.getElementById('kabMenu');
  function sohr() { T.st.set('tucha.akk', a); }
  var STAVKA = 16.42;

  /* ---------- профиль и вид ---------- */
  if (!a.profil) a.profil = a.tip === 'fl' ? 'fl' : 'ul';
  if (a.profil === 'ul' && !a.kompaniya) a.profil = 'fl';
  function fl() { return a.profil === 'fl'; }
  function mir() { return a.vid === 'mir'; }
  function pokupatel() { return !!a.pokupatel && !a.put; }          /* аккаунт из Лавки: покупает, хранения пока нет */
  function estPokupki(pr) { return (T.st.get('tucha.zakazy') || []).some(function (o) { return (o.pr || 'fl') === pr; }); }
  var IMENA = { zh: ['Анна', 'Мария', 'Ольга'], m: ['Олег', 'Дмитрий', 'Игорь'] };
  function polPers() { return IMENA.m.indexOf(imya()) >= 0 ? 'm' : 'zh'; }
  function dogovor() { return (a.status || 0) >= 3; }
  function imya() { return a.manager || 'Анна'; }
  function kto() { return mir() ? 'персонаж' : 'менеджер'; }
  function sposob() { return mir() ? (a.zayavkiSposob || (a.mir && a.mir.zayavki) || 'kabinet') : 'kabinet'; }
  function mess() { return a.messenger || (a.mir && a.mir.messenger) || 'Telegram'; }
  function kanal() { return a.kanal || 'zvonok'; }
  function rub(n) { return Math.round(n).toLocaleString('ru-RU') + ' ₽'; }
  function mes(n) { var m = n % 10, d = n % 100; return d > 10 && d < 20 ? 'месяцев' : m === 1 ? 'месяц' : m > 1 && m < 5 ? 'месяца' : 'месяцев'; }
  function dataTxt(t) { return new Date(t).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }); }
  function li(x) { return '<li>' + x + '</li>'; }
  /* личное: приветствие по времени суток и имени, главное дело сейчас */
  function privet() { var h = new Date().getHours(); return (h >= 5 && h < 12 ? 'Доброе утро' : h >= 12 && h < 18 ? 'Добрый день' : h >= 18 && h < 23 ? 'Добрый вечер' : 'Доброй ночи') + (imyaKl() ? ', ' + imyaKl() : ''); }
  function imyaKl() { return a.imya && !/^(Клиент|Демо-клиент)$/.test(a.imya) ? esc(a.imya.split(' ')[0]) : ''; }
  function glavnoe() {
    var sp = zayavki().filter(function (z) { return z.st < ZSTATUS[z.vid].length - 1; });
    if (!sp.length) return fl() ? 'Ваши вещи на местах, заявок в работе нет' : 'Товар на местах, заявок в работе нет';
    var z = sp[sp.length - 1];
    return 'Сейчас: ' + ZNAZV[z.vid].toLowerCase() + ' № ' + z.n + ', ' + esc(z.opis) + ' · ' + ZSTATUS[z.vid][z.st].toLowerCase();
  }

  /* ---------- демо-данные: заполняются один раз, дальше меняются действиями ---------- */
  var DEN = 864e5, SEYCHAS = Date.now();
  if (!a.v2) {
    a.v2 = 1;
    if (a.inn === '7700000000') { a.kompaniya = 'ООО «Северный ветер» (демо)'; a.imya = a.imya === 'Демо-клиент' ? 'Ирина Соколова' : a.imya; a.lichnyy = true; }
    a.tovary = [
      { art: 'KOF-1K', name: 'Кофе в зёрнах, арабика 100 %, 1 кг', ost: 128, ed: 'короб', mesto: 'A-02-09', pal: 6, dvizh: 2, lavka: 5 },
      { art: 'CHAY-500', name: 'Чай чёрный листовой, 500 г', ost: 94, ed: 'короб', mesto: 'A-02-07', pal: 4, dvizh: 5, lavka: 4 },
      { art: 'SIR-1L', name: 'Сироп карамельный, 1 л', ost: 36, ed: 'короб', mesto: 'A-03-11', pal: 2, dvizh: 21, lavka: 0 },
      { art: 'STAK-300', name: 'Стакан бумажный 300 мл', ost: 60, ed: 'короб', mesto: 'B-01-02', pal: 3, dvizh: 26, lavka: 0 }];
    a.veshchi = [
      { name: 'Диван трёхместный, в плёнке', mesto: 'Тёплая зона, место 14', foto: 1 },
      { name: 'Коробки с книгами, 12 шт', mesto: 'Тёплая зона, место 15', foto: 1 },
      { name: 'Велосипед и два кресла', mesto: 'Тёплая зона, место 16', foto: 1 }];
    a.zayavki = [
      { n: 4176, vid: 'postavka', opis: '8 паллет, ' + dataTxt(SEYCHAS + DEN) + ', 9:00-12:00', st: 1, t: SEYCHAS - DEN },
      { n: 4172, vid: 'otgruzka', opis: 'Кофе в зёрнах, 20 коробов → Ozon FBS, ' + dataTxt(SEYCHAS), st: 2, t: SEYCHAS - 2 * DEN },
      { n: 4174, vid: 'zabrat', pr: 'fl', opis: 'Велосипед и два кресла, ' + dataTxt(SEYCHAS + 2 * DEN) + ', 12:00-15:00', st: 1, t: SEYCHAS - DEN }];
    a.priemki = [
      { t: SEYCHAS - 6 * DEN, opis: 'Кофе в зёрнах, 6 паллет', plomba: '0048217', mesto: 'A-02-09', kadr: 'kadr-stellazhi.jpg' },
      { t: SEYCHAS - 11 * DEN, opis: 'Чай чёрный, 4 паллеты', plomba: '0048102', mesto: 'A-02-07', kadr: 'kadr-pogruzchik.jpg' },
      { t: SEYCHAS - 17 * DEN, opis: 'Стаканы бумажные, 3 паллеты', plomba: '0047955', mesto: 'B-01-02', kadr: 'kadr-priemka.jpg' }];
    if (!a.vitrina) a.vitrina = { vedenie: 'sam', karty: [
      { art: 'KOF-1K', id: 5, name: 'Кофе в зёрнах, арабика 100 %, 1 кг', na: 40, st: 'prodaja' },
      { art: 'CHAY-500', id: 4, name: 'Чай чёрный листовой, 500 г', na: 30, st: 'prodaja' }] };
    sohr();
  }
  function tovary() { return a.tovary || []; }
  function vseZayavki() { return a.zayavki || []; }
  function zayavki() { return vseZayavki().filter(function (z) { return (z.pr || 'ul') === a.profil; }); }
  function mesta() { return fl() ? 3 : tovary().reduce(function (s, t) { return s + t.pal; }, 0); }

  /* ---------- разделы: одна логика, свои названия в каждом виде и профиле ---------- */
  function razdely() {
    if (pokupatel()) return [['obzor', 'Главная'], ['pokupki', 'Покупки'], ['svyaz', 'Поддержка'], ['nastroyki', 'Настройки']];
    if (fl()) return [
      ['obzor', mir() ? 'Мой мир' : 'Главная'], ['sklad', mir() ? 'Точка сохранения' : 'Мои вещи'], ['zayavki', 'Заявки'],
      ['pokupki', 'Покупки'], ['dengi', 'Документы и счета'], ['svyaz', mir() ? 'Персонаж' : 'Поддержка']].concat(mir() ? [['urovni', 'Уровни']] : []).concat([['nastroyki', 'Настройки']]);
    return [
      ['obzor', mir() ? 'Мой мир' : 'Главная'], ['sklad', mir() ? 'Точка сохранения' : 'Остатки'], ['zayavki', 'Заявки'],
      ['vitrina', 'Витрина']].concat(estPokupki('ul') ? [['pokupki', 'Покупки']] : []).concat([['dengi', 'Документы и счета'], ['svyaz', mir() ? 'Персонаж' : 'Менеджер']]).concat(mir() ? [['urovni', 'Уровни']] : []).concat([['nastroyki', 'Настройки']]);
  }
  var IKONKI = { sklad: 'hranenie', zayavki: 'dostavka', vitrina: 'vitrina', dengi: 'tamozhnya', svyaz: 'obrabotka' };
  var razdel = (location.hash || '').slice(1) || 'obzor';
  function estRazdel(r) { return razdely().some(function (x) { return x[0] === r; }); }
  if (!estRazdel(razdel)) razdel = 'obzor';

  function rMenu() {
    menu.innerHTML = razdely().map(function (r) {
      var zam = !dogovor() && (r[0] === 'sklad' || r[0] === 'zayavki' || r[0] === 'dengi');
      return '<button type="button" data-r="' + r[0] + '"' + (r[0] === razdel ? ' class="on" aria-current="page"' : '') + '>' +
        (mir() && IKONKI[r[0]] ? '<svg class="k2-mik" data-ik="' + IKONKI[r[0]] + '" aria-hidden="true"></svg>' : '') + '<span>' + r[1] +
        (zam ? '<small>после договора</small>' : '') + '</span></button>';
    }).join('');
  }

  /* «Вы входите как»: компания и личный профиль, добавить организацию */
  function rKak() {
    var sp = [];
    if (a.kompaniya) sp.push(['ul', esc(a.kompaniya), 'бизнес-аккаунт · ИНН ' + esc(a.inn)]);
    if (a.lichnyy || a.tip === 'fl') sp.push(['fl', esc(a.imya || 'Личный профиль'), 'личный кабинет']);
    var tek = sp.filter(function (x) { return x[0] === a.profil; })[0] || sp[0];
    return '<div class="k2-kak"><button type="button" class="k2-kak-b" data-kak aria-expanded="false"><span class="k2-ava" aria-hidden="true">' + tek[1].replace(/&[^;]+;|[«»"]/g, '').trim().charAt(0) + '</span>' +
      '<span><small>Вы входите как</small><b>' + tek[1] + '</b></span><i aria-hidden="true">▾</i></button>' +
      '<div class="k2-kak-sp" hidden>' + sp.map(function (x) {
        return '<button type="button" data-profil="' + x[0] + '"' + (x[0] === a.profil ? ' aria-current="true"' : '') + '><b>' + x[1] + '</b><small>' + x[2] + '</small></button>';
      }).join('') +
      (a.kompaniya ? '' : '<button type="button" data-idi="nastroyki"><b>+ Добавить организацию</b><small>по ИНН, для хранения и Витрины</small></button>') +
      (a.lichnyy || a.tip === 'fl' ? '' : '<button type="button" data-lichnyy><b>+ Личный профиль</b><small>покупки и вещи на вас лично</small></button>') + '</div></div>';
  }
  function verh(h, pod) {
    return '<div class="kab-verh"><div><h1 class="kab-h" tabindex="-1">' + h + '</h1>' + (pod ? '<p class="muted k2-pod">' + pod + '</p>' : '') + '</div>' + rKak() + '</div>';
  }
  function zamok(zag, tekst) {
    return '<div class="zamok"><b>' + zag + '</b><p>' + tekst + '</p></div>';
  }

  /* ---------- общие блоки ---------- */
  var ZNAZV = { postavka: 'Поставка', otgruzka: 'Отгрузка', dostavka: 'Доставка', vozvrat: 'Возврат', privezti: 'Привезти ещё', zabrat: 'Забрать вещи' };
  var ZSTATUS = { postavka: ['Принята', 'Слот забронирован', 'Разгружаем', 'Товар на месте'], otgruzka: ['Принята', 'Собираем', 'Готова', 'Отгружена'],
    dostavka: ['Принята', 'Собираем', 'В пути', 'Доставлена'], vozvrat: ['Принят', 'Проверяем', 'Вернули в оборот'],
    privezti: ['Принята', 'Место готово', 'Вещи на месте'], zabrat: ['Принята', 'Готовим к выдаче', 'Выдано'] };
  function vidyZayavok() { return fl() ? ['privezti', 'zabrat', 'dostavka'] : ['postavka', 'otgruzka', 'dostavka', 'vozvrat']; }
  var DEYSTV = { postavka: 'забронируем слот на приёмку', otgruzka: 'соберём к вывозу или на маркетплейс', dostavka: 'своей машиной или попуткой',
    vozvrat: 'примем, проверим, вернём в оборот', privezti: 'подготовим место', zabrat: 'приготовим к выдаче за сутки' };
  function rDeystviya() {
    return '<div class="kp-deystviya">' + vidyZayavok().map(function (v) {
      return '<button type="button" class="kp-d" data-zay="' + v + '"><b>' + (v === 'postavka' ? 'Заявить поставку' : v === 'otgruzka' ? 'Заказать отгрузку' : v === 'dostavka' ? 'Заказать доставку' : v === 'vozvrat' ? 'Обработать возврат' : ZNAZV[v]) +
        '</b><span>' + (dogovor() ? DEYSTV[v] : 'после договора') + '</span></button>';
    }).join('') + '</div>';
  }
  function rSobytiya() {
    var sp = zayavki().filter(function (z) { return z.st < ZSTATUS[z.vid].length - 1; });
    return '<div class="kart"><div class="razdel-h"><h2 class="h3">Ближайшие события</h2><button type="button" class="btn-t" data-idi="zayavki">Все заявки</button></div>' +
      (sp.length ? sp.slice(-3).reverse().map(function (z) {
        return '<div class="usl-str"><span><b>' + ZNAZV[z.vid] + ' № ' + z.n + '</b><br><span class="muted">' + esc(z.opis) + '</span></span><span class="k2-chip">' + ZSTATUS[z.vid][z.st] + '</span></div>';
      }).join('') : '<p class="pusto">Заявок в работе нет.</p>') +
      '<p class="muted k2-mel">За два часа до события пришлём напоминание, после отгрузки фото загрузки и номер машины.</p></div>';
  }
  function rFoto(n) {
    var sp = (a.priemki || []).slice(0, n || 3);
    if (fl()) sp = [{ t: SEYCHAS - 30 * DEN, opis: 'Вещи с ремонта, 3 места', plomba: '0046611', mesto: 'Тёплая зона, 14-16', kadr: 'kadr-prohod.jpg' }];
    return '<div class="kart"><div class="razdel-h"><h2 class="h3">' + (mir() ? 'Точки сохранения' : 'Фотоотчёты приёмок') + '</h2><span class="muted">снимаем каждую паллету</span></div>' +
      '<div class="k2-foto">' + sp.map(function (p, i) {
        return '<button type="button" class="k2-foto-k" data-foto="' + i + '"><img src="' + R + 'assets/img/' + p.kadr + '" alt="" loading="lazy"><span><b>' + dataTxt(p.t) + '</b>' + esc(p.opis) + '</span></button>';
      }).join('') + '</div><p class="muted k2-mel">Снимки хранятся весь договор и год после: если товар пришёл битым, это видно на фото приёмки.</p></div>';
  }
  function rezervMes() {          /* срок резервации: из настроек, а если не меняли, то выбранный в игре */
    if (a.rezerv != null) return +a.rezerv;
    var h = a.mir && a.mir.bloki && a.mir.bloki.hranenie;
    return h ? +(h.srok || 0) : 0;
  }
  function schet() {
    var m = mesta(), dni = 30, hr = m * dni * STAVKA, stroki = [['Хранение · ' + m + ' ' + (fl() ? 'места' : 'паллето-мест') + ' × ' + dni + ' дней', hr]];
    /* резервация в обоих форматах; в «Мире Тучи» со скидкой уровня не складывается: действует большая */
    var rm = rezervMes(), p = { 1: 15, 3: 20, 6: 30, 12: 40 }[rm] || 0;
    var ur = mir() ? T.klubUroven(a.staj) : 0, sk = mir() ? (T.KLUB[ur].skidka || 0) : 0;
    if (p && p >= sk) stroki.push(['Резервация на ' + rm + ' ' + mes(rm) + ' · −' + p + ' %', -hr * p / 100]);
    else if (sk) stroki.push(['Скидка уровня «' + T.KLUB[ur].imya + '» · −' + sk + ' %', -hr * sk / 100]);
    if (!fl()) stroki.push(['Операции · по прайсу, сверх бесплатных', 0]);
    var itog = stroki.reduce(function (s, x) { return s + x[1]; }, 0);
    return { stroki: stroki, itog: itog };
  }
  function rSchet(kratko) {
    var s = schet(), oplacheno = a.oplacheno === new Date().getMonth();
    return '<div class="kart k2-schet"><div class="razdel-h"><h2 class="h3">Счёт за месяц</h2><span class="muted">' + (oplacheno ? 'оплачен' : 'оплатить до 15 числа') + '</span></div>' +
      (kratko ? '' : '<table class="kp-tabl"><tbody>' + s.stroki.map(function (x) { return '<tr><td>' + x[0] + '</td><td>' + (x[1] ? rub(x[1]) : 'по факту') + '</td></tr>'; }).join('') + '</tbody></table>') +
      '<p class="k2-itog"><span>К оплате</span><b>' + (oplacheno ? '0 ₽' : rub(s.itog)) + '</b></p>' +
      (oplacheno ? '<p class="muted">Спасибо, оплата получена.</p>' : '<p class="cta-pol"><button type="button" class="btn btn-sm" data-oplatit>' + (fl() ? 'Оплатить картой' : 'Оплатить') + '</button>' +
        (fl() ? '' : '<button type="button" class="btn-t" data-skachat="schet">Скачать счёт</button>') + '</p>') + '</div>';
  }
  function rSvyazKratko() {
    return '<div class="kart manager"><div class="m-verh"><span class="ava" aria-hidden="true">' + imya()[0] + '</span><div><b>' + imya() + '</b><span class="muted">ваш ' + kto() + '</span></div></div>' +
      '<p class="muted">На связи пн-пт с 9:00 до 18:00, обычно отвечает за 15 минут.</p>' +
      '<div class="m-kn"><button type="button" class="btn btn-2 btn-sm" data-idi="svyaz">Написать</button><a class="btn btn-2 btn-sm" href="tel:+74956658242" data-goal="call_click">Позвонить</a></div></div>';
  }
  function rStatus() {
    var sp = mir() ? ['Мир сохранён', 'Персонаж на связи', 'Готовим договор', 'Договор подписан', 'Товар под тучей'] : ['Заявка сохранена', 'Менеджер на связи', 'Готовим договор', 'Договор подписан', 'Товар на складе'];
    var st = a.status || 0;
    return '<div class="kart"><div class="razdel-h"><h2 class="h3">Подключение</h2><span class="status-tek">' + sp[st] + '</span></div>' +
      '<div class="status">' + sp.map(function (x, i) { return '<div class="' + (i < st ? 'done' : i === st ? 'on' : '') + '">' + x + '</div>'; }).join('') + '</div>' +
      (st < 4 ? '<p class="demo-p"><button type="button" class="btn-t" data-demo-status>Демо: следующий шаг</button></p>' : '') + '</div>';
  }

  /* ---------- «Мир Тучи»: полоса уровня, условия месяца, задание ---------- */
  function rHud() {
    var i = T.klubUroven(a.staj), u = T.KLUB[i], sl = T.KLUB[i + 1], staj = a.staj || 0;
    var dolya = sl ? Math.max(0, Math.min(1, (staj - u.mes) / (sl.mes - u.mes))) : 1;
    return '<div class="km-hud uroven-k"><div class="km-znak" aria-hidden="true"><b>' + (i + 1) + '</b></div>' +
      '<div class="km-ur"><span class="km-z">Уровень ' + (i + 1) + ' из ' + T.KLUB.length + '</span><b class="km-imya">' + u.imya + '</b>' +
      '<div class="km-xp" role="progressbar" aria-label="Путь до следующего уровня" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(dolya * 100) + '"><i style="width:' + (dolya * 100).toFixed(1) + '%"></i></div>' +
      '<span class="km-pod">' + (sl ? 'До «' + sl.imya + '»: ' + (sl.mes - staj) + ' ' + mes(sl.mes - staj) + ' с выполненными условиями' : 'Вершина «Мира Тучи»') + '</span></div>' +
      '<div class="km-schet"><span><b>' + staj + '</b>' + mes(staj) + ' стажа</span><span><b>' + mesta() + '</b>' + (fl() ? 'места' : 'паллето-мест') + '</span></div>' +
      '<p class="km-demo"><button type="button" class="btn-t" data-idi="urovni">Все уровни и привилегии</button></p></div>';
  }
  function rUsloviya() {
    var i = T.klubUroven(a.staj), sp = T.klubUsloviya(i, fl());
    return '<div class="kart"><div class="razdel-h"><h2 class="h3">Условия месяца</h2><span class="muted">проверяем по фактам</span></div>' +
      '<ul class="k2-usl">' + sp.map(function (x, k) { return '<li class="' + (k === sp.length - 1 && sp.length > 2 ? 'net' : 'da') + '">' + x + '</li>'; }).join('') + '</ul>' +
      '<p class="muted k2-mel">Сорвали условие: счётчик замирает, а не обнуляется.</p></div>';
  }
  function rZadanie() {
    var z = T.zadanieMesyaca();
    if (fl() && !z.fl) return '';          /* частному лицу только задания, которые к нему относятся */
    return '<div class="zadanie' + (z.sezon ? ' sezon' : '') + '"><b>' + (z.sezon ? 'Сезонное задание' : 'Задание месяца') + '</b><p>' + z.tekst + '</p><p class="zad-obmen">Вы получаете: ' + z.vam + ' и +1 месяц стажа</p></div>';
  }
  function rRech() {
    var sp = sposob(), t = sp === 'manager' ? 'Нужно что-то со складом? Напишите мне в двух словах, заявку оформлю сам.' :
      sp === 'messenger' ? 'Заявки присылайте в ' + mess() + ': форма в кабинете подготовит сообщение.' : 'Заявки оформляются здесь, в кабинете. Я на связи, если что-то пойдёт не так.';
    if (imyaKl()) t = imyaKl() + ', ' + t.charAt(0).toLowerCase() + t.slice(1);          /* персонаж обращается по имени */
    return '<div class="k2-rech"><span class="ava" aria-hidden="true">' + imya()[0] + '</span><p><b>' + imya() + ':</b> ' + t + '</p></div>';
  }

  /* ---------- заявки: форма по виду и по выбранному способу ---------- */
  var forma = null, predTovar = '';
  function zavtra() { return new Date(Date.now() + DEN).toISOString().slice(0, 10); }
  function datTxt(s) { try { return new Date(s + 'T12:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }); } catch (e) { return s; } }
  function pole(id, lab, inp) { return '<div class="pole"><label for="' + id + '">' + lab + '</label>' + inp + '</div>'; }
  function okna() { return '<select id="z-okno" name="okno"><option>9:00-12:00</option><option>12:00-15:00</option><option>15:00-18:00</option></select>'; }
  function data(lab) { return pole('z-data', lab || 'Когда', '<input id="z-data" name="data" type="date" value="' + zavtra() + '">'); }
  function kol(v) { return pole('z-kol', 'Сколько', '<input id="z-kol" name="kol" type="number" min="1" value="' + v + '" inputmode="numeric">'); }
  function vyborTovara() {
    return pole('z-tovar', 'Товар', '<select id="z-tovar" name="tovar">' + tovary().map(function (t) {
      return '<option value="' + t.art + '"' + (t.art === predTovar ? ' selected' : '') + '>' + esc(t.name) + ' · ' + t.ost + ' ' + t.ed + '</option>';
    }).join('') + '</select>');
  }
  var MASHINY = [['Мытищи', 'завтра, 8:00', 72, 3], ['Подольск', 'завтра, 14:30', 45, 7], ['Ozon Хоругвино', 'послезавтра, 6:00', 88, 1]];
  function polyaFormy(v) {
    if (v === 'postavka') return '<div class="zk-dva">' + data('Когда привезёте') + pole('z-okno', 'Слот', okna()) + '</div>' +
      '<fieldset class="pole"><legend>Что везёте</legend><div class="vybor"><label><input type="radio" name="chto" value="паллет" checked><span>Паллеты</span></label><label><input type="radio" name="chto" value="коробов"><span>Короба</span></label></div></fieldset>' +
      '<div class="zk-dva">' + kol(6) + pole('z-mash', 'Номер машины <span class="nb">если знаете</span>', '<input id="z-mash" name="mash" type="text" placeholder="А123ВС 777">') + '</div>' +
      '<p class="muted k2-mel">Заявка до 16:00 накануне. Каждую паллету пересчитаем и сфотографируем.</p>';
    if (v === 'otgruzka') return vyborTovara() + '<div class="zk-dva">' + kol(10) + data() + '</div>' +
      '<fieldset class="pole"><legend>Куда</legend><div class="vybor">' + ['Wildberries FBS', 'Ozon FBS', 'Самовывоз', 'Транспортная компания'].map(function (x, i) {
        return '<label><input type="radio" name="kuda" value="' + x + '"' + (i ? '' : ' checked') + '><span>' + x + '</span></label>'; }).join('') + '</div></fieldset>';
    if (v === 'dostavka') return (fl() ? pole('z-chto', 'Что везём', '<input id="z-chto" name="chto" type="text" value="Диван и коробки с книгами">') : vyborTovara() + kol(4)) +
      pole('z-adres', 'Адрес', '<input id="z-adres" name="adres" type="text" placeholder="Город, улица, дом">') + '<div class="zk-dva">' + data() + pole('z-okno', 'Окно', okna()) + '</div>' +
      '<fieldset class="pole"><legend>Как везём</legend><div class="vybor"><label><input type="radio" name="mashina" value="своя" checked><span>Отдельной машиной</span></label>' +
      '<label><input type="radio" name="mashina" value="попутка"><span>Попуткой, платите долю рейса</span></label></div></fieldset>' +
      '<div class="k2-poputki" data-poputki hidden>' + MASHINY.map(function (m, i) {
        return '<label class="k2-pop"><input type="radio" name="reys" value="' + m[0] + '"' + (i ? '' : ' checked') + '><span><b>' + m[0] + '</b> ' + m[1] + '<small>заполнена на ' + m[2] + ' %, осталось ' + m[3] + ' ' + (m[3] === 1 ? 'место' : 'места') + '</small></span></label>';
      }).join('') + '</div><p class="muted k2-mel">Стоимость пришлём до выезда: считаем по объёму и адресу.</p>';
    if (v === 'vozvrat') return pole('z-otkuda', 'Откуда возврат', '<select id="z-otkuda" name="otkuda"><option>Wildberries</option><option>Ozon</option><option>Покупатель Лавки</option><option>Другое</option></select>') +
      '<div class="zk-dva">' + kol(12) + data('Когда приедет') + '</div><p class="muted k2-mel">Проверим каждую единицу: целое вернём в оборот, брак отложим и сфотографируем.</p>';
    if (v === 'privezti') return '<div class="zk-dva">' + data('Когда привезёте') + pole('z-okno', 'Время', okna()) + '</div>' +
      pole('z-chto', 'Что привезёте', '<input id="z-chto" name="chto" type="text" placeholder="Например: шкаф и 5 коробок">') + '<p class="muted k2-mel">Опишем и сфотографируем при приёмке, опись придёт в документы.</p>';
    return pole('z-chto', 'Что забираете', '<select id="z-chto" name="chto">' + (a.veshchi || []).map(function (x) { return '<option>' + esc(x.name) + '</option>'; }).join('') + '<option>Всё</option></select>') +
      '<div class="zk-dva">' + data('Когда заберёте') + pole('z-okno', 'Время', okna()) + '</div><p class="muted k2-mel">Скажите за сутки: приготовим к выдаче. Приезжать пн-пт с 9:00 до 18:00.</p>';
  }
  function rForma() {
    var vidy = vidyZayavok(); if (vidy.indexOf(forma) < 0) forma = vidy[0];
    var sp = sposob();
    var h = '<div class="k2-tabs" role="tablist">' + vidy.map(function (v) {
      return '<button type="button" role="tab" data-tab="' + v + '" aria-selected="' + (v === forma) + '"' + (v === forma ? ' class="on"' : '') + '>' + ZNAZV[v] + '</button>';
    }).join('') + '</div>';
    if (sp === 'manager') return h + '<form class="k2-f" novalidate data-zayavka="' + forma + '">' + rRech() +
      pole('z-tekst', 'Что нужно сделать', '<textarea id="z-tekst" name="tekst" rows="4" placeholder="' + (forma === 'dostavka' ? 'Отвезти 4 короба кофе в Москву, Тверская 1, в четверг утром' : 'В двух словах, персонаж уточнит детали') + '"></textarea>') +
      '<button class="btn" type="submit">Передать ' + imya() + '</button><p class="muted k2-mel">Способ заявок меняется в настройках.</p></form>';
    return h + '<form class="k2-f" novalidate data-zayavka="' + forma + '">' + polyaFormy(forma) +
      '<button class="btn" type="submit">' + (sp === 'messenger' ? 'Отправить в ' + mess() : 'Отправить заявку') + '</button>' +
      (sp === 'messenger' ? '<p class="muted k2-mel">Сообщение с заявкой уйдёт в ' + mess() + ', статус будет виден здесь. Способ меняется в настройках.</p>' : '') + '</form>';
  }
  function rSpisok() {
    var sp = zayavki();
    return '<div class="kart"><h2 class="h3">Мои заявки</h2>' + (sp.length ? sp.slice().reverse().map(function (z) {
      var st = ZSTATUS[z.vid];
      return '<div class="k2-z"><div class="k2-z-v"><b>' + ZNAZV[z.vid] + ' № ' + z.n + (z.cherez ? ' <span class="k2-chip">' + z.cherez + '</span>' : '') + '</b><span class="muted">' + esc(z.opis) + '</span></div>' +
        '<ol class="k2-st" style="--n:' + st.length + '">' + st.map(function (s, i) { return '<li class="' + (i < z.st ? 'done' : i === z.st ? 'on' : '') + '">' + s + '</li>'; }).join('') + '</ol>' +
        (z.st < st.length - 1 ? '<button type="button" class="btn-t" data-z-dalee="' + z.n + '">Демо: следующий шаг</button>' : '') + '</div>';
    }).join('') : '<p class="pusto">Заявок пока нет.</p>') + '</div>';
  }
  function otpravit(f) {
    var fd = new FormData(f), v = f.getAttribute('data-zayavka'), sp = sposob(), opis;
    if (sp === 'manager') {
      opis = String(fd.get('tekst') || '').trim();
      if (opis.length < 5) { T.toast('Напишите, что нужно сделать'); f.querySelector('textarea').focus(); return; }
    } else {
      var k = +fd.get('kol') || 0, t = tovary().filter(function (x) { return x.art === fd.get('tovar'); })[0];
      if (fd.has('kol') && k < 1) { T.toast('Укажите количество'); f.querySelector('[name=kol]').focus(); return; }
      if (v === 'dostavka' && !String(fd.get('adres') || '').trim()) { T.toast('Укажите адрес'); f.querySelector('[name=adres]').focus(); return; }
      if (v === 'privezti' && !String(fd.get('chto') || '').trim()) { T.toast('Напишите, что привезёте'); f.querySelector('[name=chto]').focus(); return; }
      var d = datTxt(fd.get('data'));
      opis = v === 'postavka' ? k + ' ' + fd.get('chto') + ', ' + d + ', ' + fd.get('okno') :
        v === 'otgruzka' ? t.name + ', ' + k + ' ' + t.ed + ' → ' + fd.get('kuda') + ', ' + d :
        v === 'dostavka' ? (t ? t.name + ', ' + k + ' ' + t.ed : fd.get('chto')) + ' → ' + fd.get('adres') + ', ' + d + ', ' + (fd.get('mashina') === 'попутка' ? 'попуткой из ' + fd.get('reys') : 'отдельной машиной') :
        v === 'vozvrat' ? k + ' ед. от ' + fd.get('otkuda') + ', ' + d : fd.get('chto') + ', ' + d + ', ' + fd.get('okno');
    }
    var n = 4180 + vseZayavki().length + 1;
    a.zayavki = vseZayavki().concat([{ n: n, vid: v, pr: a.profil, opis: opis, st: 0, t: Date.now(), cherez: sp === 'manager' ? 'через ' + imya() : sp === 'messenger' ? 'в ' + mess() : '' }]);
    sohr(); predTovar = ''; pokaz('zayavki');
    T.toast(sp === 'manager' ? imya() + ' получил задание и оформит заявку № ' + n : sp === 'messenger' ? 'Заявка № ' + n + ' ушла в ' + mess() : ZNAZV[v] + ' № ' + n + ' принята. ' + (mir() ? imya() : 'Менеджер') + ' подтвердит в течение часа');
  }

  /* ---------- склад: остатки компании или опись вещей ---------- */
  function rOstatki() {
    var t = tovary(), zanyato = mesta(), rezerv = a.rezervMest || zanyato, bez = t.filter(function (x) { return x.dvizh > 20; });
    var h = '<div class="kp-svodka"><div><span class="kp-z">Занято</span><b>' + zanyato + ' паллето-мест</b><span class="muted">' + (rezerv > zanyato ? 'из ' + rezerv + ' в резерве' : 'платите за занятые') + '</span></div>' +
      '<div><span class="kp-z">Позиций</span><b>' + t.length + '</b><span class="muted">' + t.reduce(function (s, x) { return s + x.ost; }, 0) + ' коробов</span></div>' +
      '<div><span class="kp-z">Без движения</span><b>' + bez.length + '</b><span class="muted">больше 20 дней</span></div>' +
      '<div><span class="kp-z">На Витрине</span><b>' + t.filter(function (x) { return x.lavka; }).length + '</b><span class="muted">позиции в продаже</span></div></div>';
    h += '<div class="kart k2-tabl-k"><div class="razdel-h"><h2 class="h3">Остатки</h2><span class="k2-kn"><button type="button" class="btn-t" data-skachat="ostatki">Выгрузить таблицей</button><button type="button" class="btn-t" data-sverka>Акт сверки</button></span></div>' +
      '<table class="k2-tabl"><thead><tr><th>Товар</th><th>Остаток</th><th>Место</th><th>Движение</th><th></th></tr></thead><tbody>' + t.map(function (x) {
        return '<tr><td><b>' + esc(x.name) + '</b><span class="muted">' + x.art + (x.lavka ? ' · ' + x.lavka + ' коробов на Витрине' : '') + '</span></td><td>' + x.ost + ' ' + x.ed + '</td><td>' + x.mesto + '</td>' +
          '<td' + (x.dvizh > 20 ? ' class="k2-warn"' : '') + '>' + (x.dvizh > 20 ? x.dvizh + ' дн. без движения' : x.dvizh + ' дн. назад') + '</td>' +
          '<td class="k2-kn"><button type="button" class="btn btn-2 btn-sm" data-otgruzit="' + x.art + '">Отгрузить</button>' + (x.lavka ? '' : '<button type="button" class="btn-t" data-na-vitrinu="' + x.art + '">На Витрину</button>') + '</td></tr>';
      }).join('') + '</tbody></table><p class="muted k2-mel">Выгрузка для Excel и 1С. Акт сверки подписывает ' + imya() + ', его можно отправить контрагенту как есть.</p></div>';
    if (bez.length) h += '<div class="k2-pers"><p><b>' + bez.length + ' ' + (bez.length === 1 ? 'позиция' : 'позиции') + ' без движения больше 20 дней.</b> Выставьте их на Витрину: товар продаётся прямо с полки, возить никуда не нужно.</p></div>';
    return h + rFoto(3);
  }
  function rVeshchi() {
    return '<div class="kp-svodka"><div><span class="kp-z">Места</span><b>3 места</b><span class="muted">тёплая зона</span></div><div><span class="kp-z">В месяц</span><b>' + rub(3 * 30 * STAVKA) + '</b><span class="muted">пересчёт по дням</span></div>' +
      '<div><span class="kp-z">Доступ</span><b>пн-пт 9-18</b><span class="muted">скажите за сутки</span></div><div><span class="kp-z">Опись</span><b>подписана</b><span class="muted">при приёмке</span></div></div>' +
      '<div class="kart"><div class="razdel-h"><h2 class="h3">Что лежит на складе</h2><button type="button" class="btn-t" data-skachat="opis">Скачать опись</button></div>' +
      (a.veshchi || []).map(function (x) { return '<div class="usl-str"><span><b>' + esc(x.name) + '</b><br><span class="muted">' + esc(x.mesto) + ' · фото при приёмке</span></span></div>'; }).join('') +
      '<p class="cta-pol k2-top"><button type="button" class="btn btn-sm" data-zay="zabrat">Забрать вещи</button><button type="button" class="btn btn-2 btn-sm" data-zay="privezti">Привезти ещё</button><button type="button" class="btn btn-2 btn-sm" data-zay="dostavka">Заказать доставку</button></p>' +
      '<p class="muted k2-mel">Если что-то пропадёт или повредится, отвечаем мы: опись подписана обеими сторонами.</p></div>' + rFoto(1);
  }

  /* ---------- Витрина компании ---------- */
  var vitrTab = 'tovary', novaya = false;
  var VEDENIE = [['sam', 'Сами', '0 ₽', 'карточки и цены ведёте вы'], ['pomosh', 'С помощью', 'от 4 900 ₽/мес', 'снимем товар и напишем описания'], ['klyuch', 'Под ключ', 'от 14 900 ₽/мес', 'ведём Витрину целиком']];
  var ZAKAZY = [['4231', 'Кофе в зёрнах, 6 коробов', 'новый', 26640], ['4228', 'Чай чёрный, 2 короба', 'собираем', 7380], ['4219', 'Кофе в зёрнах, 1 паллета', 'отгружен', 118400], ['4214', 'Чай чёрный, 4 короба', 'отгружен', 14760]];
  function vitr() { return a.vitrina || { vedenie: 'sam', karty: [] }; }
  function rVitrina() {
    if (novaya) return rNovayaKarta();
    var v = vitr(), prodano = ZAKAZY.reduce(function (s, z) { return s + z[3]; }, 0);
    var h = '<div class="kp-svodka k2-3"><div><span class="kp-z">Продажи за месяц</span><b>' + rub(prodano) + '</b><span class="muted">товар не покидал склад</span></div>' +
      '<div><span class="kp-z">Заказов</span><b>' + ZAKAZY.length + '</b><span class="muted">1 новый, 1 собираем</span></div>' +
      '<div><span class="kp-z">Выплата в пятницу</span><b>' + rub(prodano * 0.3) + '</b><span class="muted">за отгруженное за неделю</span></div></div>' +
      '<div class="k2-tabs k2-tabs-mal" role="tablist"><button type="button" role="tab" data-vtab="tovary" aria-selected="' + (vitrTab === 'tovary') + '"' + (vitrTab === 'tovary' ? ' class="on"' : '') + '>Мои товары</button>' +
      '<button type="button" role="tab" data-vtab="zakazy" aria-selected="' + (vitrTab === 'zakazy') + '"' + (vitrTab === 'zakazy' ? ' class="on"' : '') + '>Заказы покупателей</button></div>';
    if (vitrTab === 'zakazy') {
      h += '<div class="kart">' + ZAKAZY.map(function (z) {
        return '<div class="usl-str"><span><b>Заказ № ' + z[0] + '</b><br><span class="muted">' + z[1] + ' · ' + rub(z[3]) + '</span></span><span class="k2-chip' + (z[2] === 'отгружен' ? ' ok' : '') + '">' + z[2] + '</span></div>';
      }).join('') + '<p class="muted k2-mel">Собираем и отгружаем мы. Отказался при погрузке: товар вернётся на вашу полку, деньги покупателю вернём мы.</p></div>';
    } else {
      h += '<div class="kart"><div class="razdel-h"><h2 class="h3">Карточки</h2><button type="button" class="btn btn-sm" data-nova>Добавить товар</button></div>' +
        (v.karty.length ? v.karty.map(function (c) {
          var t = tovary().filter(function (x) { return x.art === c.art; })[0];
          return '<div class="usl-str"><span><b>' + esc(c.name) + '</b><br><span class="muted">на Витрине ' + c.na + ' из ' + (t ? t.ost : c.na) + ' коробов · остальное просто хранится</span></span>' +
            '<span class="k2-chip' + (c.st === 'prodaja' ? ' ok' : '') + '">' + (c.st === 'prodaja' ? 'в продаже' : 'на проверке') + '</span></div>';
        }).join('') : '<p class="pusto">Карточек пока нет.</p>') +
        '<p class="muted k2-mel">Проданное вычитается из остатка само. Сколько выставить, решаете вы.</p></div>';
      h += '<div class="setka s2"><div class="kart"><h2 class="h3">Что тормозит продажи</h2><ul class="k2-usl"><li class="net">Сироп и стаканы 20+ дней без движения: выставьте на Витрину</li><li class="da">Остатки в порядке: ни одной карточки без товара</li></ul></div>' +
        '<div class="kart"><h2 class="h3">Кто ведёт Витрину</h2><div class="vybor k2-ved">' + VEDENIE.map(function (x) {
          return '<label><input type="radio" name="vedenie" value="' + x[0] + '"' + (v.vedenie === x[0] ? ' checked' : '') + '><span><b>' + x[1] + '</b> · ' + x[2] + '</span></label>';
        }).join('') + '</div><p class="muted k2-mel">' + VEDENIE.filter(function (x) { return x[0] === v.vedenie; })[0][3] + '. Меняется с первого числа.</p></div></div>';
    }
    return h;
  }
  function rNovayaKarta() {
    var t = tovary().filter(function (x) { return x.art === predTovar; })[0] || tovary().filter(function (x) { return !x.lavka; })[0] || tovary()[0];
    return '<p><button type="button" class="btn-t" data-k-vitr>← Витрина</button></p><div class="k2-nk"><form class="kart k2-f" novalidate data-karta>' +
      '<fieldset class="k2-fs"><legend>Что за товар</legend>' + pole('k-tovar', 'Товар со склада', '<select id="k-tovar" name="art">' + tovary().map(function (x) {
        return '<option value="' + x.art + '"' + (x === t ? ' selected' : '') + '>' + esc(x.name) + ' · ' + x.ost + ' ' + x.ed + '</option>'; }).join('') + '</select>') +
      pole('k-name', 'Название на Витрине', '<input id="k-name" name="name" type="text" maxlength="70" value="' + esc(t.name) + '">') +
      pole('k-cat', 'Категория', '<select id="k-cat" name="cat">' + ['Продукты и напитки', 'Бытовая химия', 'Дом и посуда', 'Упаковка', 'Зоотовары', 'Текстиль'].map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select>') + '</fieldset>' +
      '<fieldset class="k2-fs"><legend>Как опознать на складе</legend><div class="zk-dva">' + pole('k-art', 'Артикул', '<input id="k-art" name="artikul" type="text" value="' + t.art + '">') +
      pole('k-ean', 'Штрихкод EAN-13', '<input id="k-ean" name="ean" type="text" inputmode="numeric" placeholder="4600000000000">') + '</div>' +
      '<div class="zk-dva">' + pole('k-box', 'В коробе, шт', '<input id="k-box" name="boxN" type="number" min="1" value="6">') + pole('k-pal', 'Коробов на паллете', '<input id="k-pal" name="palN" type="number" min="1" value="40">') + '</div></fieldset>' +
      '<fieldset class="k2-fs"><legend>Цены за штуку, ₽</legend><div class="vt-ceny">' + [['one', 'Штучно', 740], ['box', 'Коробом', 690], ['pal', 'Паллетой', 610]].map(function (x) {
        return '<label><span>' + x[1] + '</span><input name="' + x[0] + '" type="number" min="1" inputmode="numeric" value="' + x[2] + '"></label>'; }).join('') + '</div></fieldset>' +
      '<fieldset class="k2-fs"><legend>Сколько выставить</legend>' + pole('k-na', 'Коробов на Витрине', '<input id="k-na" name="na" type="number" min="1" value="' + Math.min(20, t.ost) + '">') +
      '<p class="muted k2-mel">Остальное просто хранится и в Лавке не показывается.</p>' +
      '<label class="galka"><input type="checkbox" name="foto" checked><span>Снять товар на складе: фото сделаем сами</span></label></fieldset>' +
      '<p class="cta-pol"><button class="btn" type="submit">Отправить на проверку</button><button type="button" class="btn btn-2" data-poruchit>Поручить нам</button></p></form>' +
      '<div class="k2-pr"><p class="eb">Так увидят в Лавке</p><div data-pr></div></div></div>';
  }
  function risovatPr() {
    var f = box.querySelector('form[data-karta]'), pr = box.querySelector('[data-pr]');
    if (!f || !pr || !L) return;
    var fd = new FormData(f), baza = L.PO_ID[5];
    var t = Object.assign({}, baza, { id: 0, name: fd.get('name') || 'Ваш товар', sel: a.kompaniya, cat: fd.get('cat'), badge: '', one: +fd.get('one') || 0, box: +fd.get('box') || 0, pal: +fd.get('pal') || 0,
      boxN: +fd.get('boxN') || 1, palN: (+fd.get('palN') || 1) * (+fd.get('boxN') || 1), mesto: 'ваше место на складе', reyting: 5, otzyvy: 0 });
    var cat = Object.keys(L.PO_ID).map(function (k) { return L.PO_ID[k]; }).filter(function (x) { return x.cat === t.cat; })[0];
    if (cat) { t.cvet = cat.cvet; t.forma = cat.forma; t.boxName = cat.boxName; }
    pr.innerHTML = L.kartochka(t, { vitrina: true, bezSsylki: true, bezKnopki: true });
  }

  /* ---------- документы и счета ---------- */
  function rDengi() {
    var docs = fl() ? [['ДОГ', 'Договор хранения', 'бессрочный, по телефону и почте'], ['ОПИСЬ', 'Опись при приёмке', 'подписана обеими сторонами · 3 позиции'], ['АКТ', 'Акт за прошлый месяц', 'хранение 3 места'], ['ЧЕК', 'Чеки по покупкам', 'архив за квартал']] :
      [['УПД', 'УПД за прошлый месяц', 'хранение и обработка'], ['СЧЁТ', 'Счёт за текущий месяц', 'выставлен 1 числа'], ['ТОРГ-12', 'Накладная по отгрузке', 'отгрузка на Ozon FBS'], ['АКТ', 'Акт сверки за полугодие', 'расхождений нет'], ['ДОГ', 'Договор ответственного хранения', 'действует бессрочно']];
    var h = '<div class="kp-g"><div class="kart"><div class="razdel-h"><h2 class="h3">Документы</h2><span class="muted">' + (fl() ? 'хранятся весь договор и год после' : 'через ЭДО, оригиналы с отгрузкой') + '</span></div>' +
      docs.map(function (d) { return '<div class="usl-str"><span class="k2-doc"><i>' + d[0] + '</i><span><b>' + d[1] + '</b><br><span class="muted">' + d[2] + '</span></span></span><button type="button" class="btn-t" data-skachat="doc">Скачать</button></div>'; }).join('') + '</div>' +
      '<div>' + rSchet(false) + '</div></div>';
    if (!fl()) h += '<div class="kart"><div class="razdel-h"><h2 class="h3">Отчёты и выгрузки</h2><span class="muted">для Excel и 1С</span></div><div class="k2-vyg">' +
      [['ostatki', 'Остатки на дату', 'позиции, места, вес и объём'], ['dvizh', 'Приёмки и отгрузки', 'с номерами машин и слотами'], ['foto', 'Фотоотчёты приёмок', 'архив снимков'], ['vitrina', 'Продажи на Витрине', 'заказы, выручка, возвраты']].map(function (x) {
        return '<button type="button" class="k2-vyg-k" data-skachat="' + x[0] + '"><b>' + x[1] + '</b><span>' + x[2] + '</span></button>';
      }).join('') + '</div><p class="cta-pol k2-top"><button type="button" class="btn btn-2 btn-sm" data-sverka>Запросить акт сверки</button></p></div>';
    return h;
  }

  /* ---------- связь: менеджер или персонаж ---------- */
  var HARAKTER = [['shturman', 'Штурман', 'коротко и по делу'], ['hranitel', 'Хранитель', 'подробно, всё объясняет'], ['arhitektor', 'Архитектор', 'сам предложит, как выгоднее']];
  var FAQ = fl() ? [['Как забрать вещи', 'заявка «Забрать вещи», готовим за сутки'], ['Можно приехать посмотреть', 'по будням, без записи'], ['Что если вещь повредится', 'отвечаем по описи с фото']] :
    [['Пропуск на территорию', 'оформляем на машину и водителя за 2 часа'], ['Когда приходит лист приёмки', 'в день поступления машины'], ['Как долго хранятся фото', 'весь договор и год после'], ['Приехать посмотреть товар', 'по будням, предупредите заранее']];
  function rSvyaz() {
    var p = a.persona && HARAKTER.filter(function (x) { return x[0] === a.persona; })[0];
    return '<div class="setka s2"><div class="kart manager"><div class="m-verh"><span class="ava" aria-hidden="true">' + imya()[0] + '</span><div><b>' + imya() + '</b><span class="muted">' + (p && mir() ? p[1] + ' · ' : '') + 'ваш ' + kto() + '</span></div></div>' +
      '<table class="kp-tabl"><tbody><tr><td>Телефон</td><td><a href="tel:+74956658242">+7 (495) 665-82-42</a></td></tr><tr><td>Мессенджер</td><td>' + mess() + '</td></tr><tr><td>Отвечает</td><td>пн-пт 9:00-18:00</td></tr></tbody></table>' +
      '<p class="muted k2-mel">' + (mir() ? 'Не сошлись характерами? Персонажа можно сменить в настройках: постройка и история останутся.' : 'Ведёт вас с первой поставки. На время отпуска передаёт дела с полным вводом в курс.') + '</p></div>' +
      '<div class="kart"><h2 class="h3">Переписка</h2><p class="muted">Сейчас отвечает помощник, бот, не живой человек. Сложное передаст ' + imya() + '.</p><div data-chat-kab></div></div></div>' +
      '<div class="kart"><h2 class="h3">Частые вопросы</h2>' + FAQ.map(function (x) { return '<div class="usl-str"><span>' + x[0] + '</span><span class="muted">' + x[1] + '</span></div>'; }).join('') + '</div>';
  }

  /* ---------- покупки частного лица ---------- */
  var pokTab = 'zakazy';
  function rPokupki() {
    var h = '<div class="k2-tabs k2-tabs-mal" role="tablist">' + [['zakazy', 'Заказы'], ['izbrannoe', 'Избранное'], ['vozvraty', 'Возвраты']].map(function (x) {
      return '<button type="button" role="tab" data-ptab="' + x[0] + '" aria-selected="' + (pokTab === x[0]) + '"' + (pokTab === x[0] ? ' class="on"' : '') + '>' + x[1] + '</button>';
    }).join('') + '</div>';
    if (pokTab === 'zakazy') return h + '<div data-pokupki-kab></div>';
    if (pokTab === 'izbrannoe') return h + '<div class="kart">' + [5, 4, 11].map(function (id) {
      var t = L && L.PO_ID[id]; return t ? '<div class="usl-str"><span><b>' + esc(t.name) + '</b><br><span class="muted">' + esc(t.sel) + ' · ' + t.box + ' ₽ коробом · есть на складе</span></span><a class="btn btn-2 btn-sm" href="' + R + 'lavka/tovar/?id=' + id + '">Купить</a></div>' : '';
    }).join('') + '<p class="muted k2-mel">Когда товар из избранного снова появится на складе, пришлём уведомление.</p></div>';
    return h + '<div class="kart"><div class="usl-str"><span><b>Ящик пластиковый, 4 шт</b><br><span class="muted">ООО «Гастро-Опт» · деньги придут до 25 числа</span></span><span class="k2-chip">проверяем</span></div>' +
      '<ol class="k2-shagi"><li>Откройте покупку в «Заказах» и нажмите «Оформить возврат»</li><li>Укажите причину: не подошёл, повреждён, пересорт</li><li>Склад сверит по фото приёмки, деньги придут на карту за 3-10 рабочих дней</li></ol>' +
      '<p class="muted k2-mel">Товар остаётся на складе, везти никуда не нужно.</p></div>';
  }

  /* ---------- настройки ---------- */
  function rNastroyki() {
    var h = '<div class="setka s2">' +
      '<div class="kart"><h2 class="h3">Мои данные</h2>' + pole('my-imya', 'Имя и фамилия', '<input id="my-imya" name="my-imya" type="text" autocomplete="name" value="' + esc(a.imya || '') + '">') +
        pole('my-tel', 'Телефон', '<input id="my-tel" name="my-tel" type="tel" autocomplete="tel" value="' + esc(a.tel || '') + '">') +
        pole('my-pochta', 'Почта', '<input id="my-pochta" name="my-pochta" type="email" autocomplete="email" value="' + esc(a.pochta || '') + '">') +
        '<p class="muted k2-mel">По этому номеру вы входите в кабинет и получаете SMS о приёмках.</p></div>' + (pokupatel() ? '' :
      '<div class="kart"><h2 class="h3">Формат работы</h2><div class="vybor"><label><input type="radio" name="vid" value="prosto"' + (mir() ? '' : ' checked') + '><span>Всё просто</span></label>' +
      '<label><input type="radio" name="vid" value="mir"' + (mir() ? ' checked' : '') + '><span>Мир Тучи</span></label></div>' +
      '<p class="muted k2-mel">«Всё просто»: обычный кабинет, скидка за срок. «Мир Тучи»: ваш мир, уровни и персонаж. Данные и заявки не меняются.</p></div>') +
      '<div class="kart"><h2 class="h3">Профили</h2>' + (a.kompaniya ? '<div class="usl-str"><span><b>' + esc(a.kompaniya) + '</b><br><span class="muted">ИНН ' + esc(a.inn) + '</span></span><button type="button" class="btn-t" data-profil="ul">' + (fl() ? 'Перейти' : 'текущий') + '</button></div>' : '') +
      (a.lichnyy || a.tip === 'fl' ? '<div class="usl-str"><span><b>' + esc(a.imya || 'Личный профиль') + '</b><br><span class="muted">частное лицо</span></span><button type="button" class="btn-t" data-profil="fl">' + (fl() ? 'текущий' : 'Перейти') + '</button></div>' : '<p><button type="button" class="btn btn-2 btn-sm" data-lichnyy>Добавить личный профиль</button></p>') +
      (a.kompaniya ? '' : '<form class="k2-inn" novalidate data-org>' + pole('org-inn', 'Добавить организацию: ИНН', '<input id="org-inn" name="inn" type="text" inputmode="numeric" maxlength="12" placeholder="10 или 12 цифр">') + '<button class="btn btn-2 btn-sm" type="submit">Добавить</button></form>') + '</div>' +
      '<div class="kart"><h2 class="h3">Как с вами связаться</h2><div class="vybor">' + [['zvonok', 'Звонок'], ['pochta', 'Почта'], ['messenger', 'Мессенджер'], ['chat', 'Чат на сайте'], ['vstrecha', 'Встреча на складе']].map(function (x) {
        return '<label><input type="radio" name="kanal" value="' + x[0] + '"' + (kanal() === x[0] ? ' checked' : '') + '><span>' + x[1] + '</span></label>'; }).join('') + '</div>' +
      '<div class="vybor k2-top" data-mess' + (kanal() === 'messenger' ? '' : ' hidden') + '>' + ['Telegram', 'WhatsApp', 'Max'].map(function (x) {
        return '<label><input type="radio" name="messenger" value="' + x + '"' + (mess() === x ? ' checked' : '') + '><span>' + x + '</span></label>'; }).join('') + '</div></div>';
    if (mir()) h += '<div class="kart"><h2 class="h3">Как оставлять заявки</h2><div class="vybor">' + [['kabinet', 'В личном кабинете'], ['messenger', 'Сообщением в мессенджер'], ['manager', 'Через персонажа']].map(function (x) {
        return '<label><input type="radio" name="sposob" value="' + x[0] + '"' + (sposob() === x[0] ? ' checked' : '') + '><span>' + x[1] + '</span></label>'; }).join('') + '</div><p class="muted k2-mel">Выбрали при сборке мира. Можно поменять в любой момент.</p></div>' +
      '<div class="kart"><h2 class="h3">Персонаж</h2><div class="vybor">' + HARAKTER.map(function (x) {
        return '<label><input type="radio" name="harakter" value="' + x[0] + '"' + (a.persona === x[0] ? ' checked' : '') + '><span><b>' + x[1] + '</b>: ' + x[2] + '</span></label>'; }).join('') + '</div>' +
      '<div class="vybor k2-top">' + [['zh', 'Женский'], ['m', 'Мужской']].map(function (x) {
        return '<label><input type="radio" name="pol" value="' + x[0] + '"' + (polPers() === x[0] ? ' checked' : '') + '><span>' + x[1] + '</span></label>'; }).join('') + '</div>' +
      '<p class="muted k2-mel">Сменить можно, если не сошлись характерами: постройка и история останутся.</p><p><a class="btn btn-2 btn-sm" href="' + R + 'start/mir/?dostroit=1' + (T.v2() ? '&v2=1' : '') + '">Изменить постройку</a></p></div>';
    if (!pokupatel()) h += '<div class="kart"><h2 class="h3">' + (mir() ? 'Резервация мест' : 'Скидка за срок') + '</h2><div class="vybor">' + [[0, 'По факту'], [1, '1 мес · −15 %'], [3, '3 мес · −20 %'], [6, '6 мес · −30 %'], [12, '12 мес · −40 %']].map(function (x) {
        return '<label><input type="radio" name="rezerv" value="' + x[0] + '"' + (rezervMes() === x[0] ? ' checked' : '') + '><span>' + x[1] + '</span></label>'; }).join('') + '</div><p class="muted k2-mel">«Займи место под Тучей»: места и цена за вами, оплата вперёд.' + (mir() ? ' Со скидкой уровня не складывается: действует большая.' : '') + '</p></div>';
    h += (fl() ? '<div class="kart"><h2 class="h3">Адреса доставки</h2><p class="muted">' + (a.adres ? esc(a.adres) : 'Пока нет: добавится после первой доставки.') + '</p></div>' :
      '<div class="kart"><h2 class="h3">Доступ сотрудникам</h2><p>Сейчас входит ' + esc(a.imya || 'один человек') + ', ' + esc(a.tel || '') + '.</p><p class="muted k2-mel">Добавим кладовщика или бухгалтера с отдельными правами по запросу.</p></div>') +
      '<div class="kart"><h2 class="h3">Выход</h2><p class="muted">Вход держится 30 дней на этом устройстве.</p><p class="cta-pol"><button type="button" class="btn btn-2 btn-sm" data-vyyti>Выйти</button><button type="button" class="btn-t" data-steret>Стереть демо-данные</button></p></div></div>';
    return h;
  }

  /* ---------- обзор: два разных вида ---------- */
  var novyy = (/[?&]novyy=(\w+)/.exec(location.search) || [])[1];
  function rPrivet() {
    if (!novyy) return '';
    var t = novyy === 'dostroil' ? 'Мир сохранён. Изменения уже видит ваш персонаж.' :
      mir() ? 'Ваш мир сохранён. ' + imya() + ' ' + T.kakSvyazhetsya(kanal(), mess()) + '.' : 'Готово. ' + imya() + ', ваш менеджер, позвонит в рабочее время, пн-пт с 9:00 до 18:00.';
    return '<div class="k2-pers"><div><b>' + (novyy === 'dostroil' ? 'Сохранено' : 'Добро пожаловать под тучу') + '</b><p>' + t + '</p></div><button type="button" class="btn-t" data-privet-ok>Понятно</button></div>';
  }
  function rObzor() {
    if (pokupatel()) return verh(privet(), 'Ваши покупки в Лавке') + '<div data-pokupki-kab></div>' +
      '<div class="k2-pers"><div><b>Хотите хранить вещи или товар?</b><p>Выберите формат: аккаунт тот же, покупки останутся здесь.</p></div>' +
      '<a class="btn btn-sm" href="' + R + (T.v2() ? 'v2/' : '') + 'start/#format">Выбрать формат</a></div>';
    if (!dogovor()) return rPrivet() + verh(mir() ? 'Мой мир' : privet(), 'Кабинет откроется полностью после договора: заявки, остатки и документы.') +
      (mir() ? rHud() : '') + '<div class="kp-g"><div>' + rStatus() + '<div class="kart"><h2 class="h3">Что приготовить к разговору</h2><ul class="spis-ok"><li>Объём и тип товара: паллеты, коробки, вес</li><li>Даты первой поставки</li><li>Нужны ли маркировка, сборка и доставка</li></ul></div></div><div>' + rSvyazKratko() + '</div></div>';
    if (mir()) {
      return rPrivet() + verh('Мой мир', fl() ? 'Ваши вещи под тучей' : 'Нажмите на постройку: откроется нужный раздел') + rHud() +
        '<div class="kab-mir"><div class="mir-scena kab-scena"><svg id="kabScena" role="img" aria-label="Ваш мир: постройки открывают разделы кабинета"></svg></div>' +
        '<div class="kab-kol">' + rRech() + rZadanie() + '</div></div>' + rDeystviya() +
        '<div class="kp-g"><div>' + rSobytiya() + rFoto(fl() ? 1 : 3) + '</div><div>' + rUsloviya() + rSchet(true) + '</div></div>';
    }
    var s = schet();
    var svodka = fl() ? [['Места', '3 места', 'тёплая зона'], ['Заявок в работе', String(zayavki().filter(function (z) { return z.st < ZSTATUS[z.vid].length - 1; }).length), 'статусы в «Заявках»'], ['Счёт за месяц', rub(s.itog), 'до 15 числа'], ['Поддержка', imya(), 'пн-пт 9:00-18:00']] :
      [['Занято', mesta() + ' паллето-мест', 'платите за занятые'], ['Заявок в работе', String(zayavki().filter(function (z) { return z.st < ZSTATUS[z.vid].length - 1; }).length), 'статусы в «Заявках»'], ['Счёт за месяц', a.oplacheno === new Date().getMonth() ? 'оплачен' : rub(s.itog), 'до 15 числа'], ['Менеджер', imya(), 'пн-пт 9:00-18:00']];
    return rPrivet() + verh(privet(), glavnoe()) +
      '<div class="kp-svodka">' + svodka.map(function (y) { return '<div><span class="kp-z">' + y[0] + '</span><b>' + y[1] + '</b><span class="muted">' + y[2] + '</span></div>'; }).join('') + '</div>' +
      rDeystviya() + '<div class="kp-g"><div>' + rSobytiya() + rFoto(fl() ? 1 : 3) + '</div><div>' + rSchet(false) + rSvyazKratko() + '</div></div>';
  }
  function rUrovni() {
    var i = T.klubUroven(a.staj);
    return verh('Уровни', 'Семь ступеней «Мира Тучи». Уровень растёт за месяцы подряд с выполненными условиями, объём не важен.') +
      '<div class="urovni-sp">' + T.KLUB.map(function (u, k) {
        return '<div class="kart urov' + (k === i ? ' tek' : k < i ? ' proyden' : '') + '"><div class="razdel-h"><h2 class="h3">' + (k + 1) + '. ' + u.imya + '</h2><span class="muted">' + (k === i ? 'ваш уровень · ' : '') + u.kogda + '</span></div>' +
          '<div class="urov-g"><div><b>Условия</b><ul class="spis-ok">' + (fl() ? T.klubUsloviya(k, true) : (k >= 2 ? ['Условия прошлых уровней'] : []).concat(u.zad)).map(li).join('') + '</ul></div><div><b>Что даёт</b><ul class="spis-ok">' + u.daet.filter(function (x) { return !fl() || !/Витрин/.test(x); }).map(li).join('') + '</ul></div></div></div>';
      }).join('') + '</div>';
  }

  var RENDER = {
    obzor: rObzor,
    sklad: function () {
      if (!dogovor()) return verh(fl() ? 'Мои вещи' : 'Остатки') + zamok('Откроется после договора', 'Здесь будут остатки, места и фото каждой приёмки.');
      return verh(mir() ? 'Точка сохранения' : fl() ? 'Мои вещи' : 'Остатки', fl() ? 'Опись с фото при приёмке' : 'Обновляются после каждой приёмки и отгрузки') + (fl() ? rVeshchi() : rOstatki());
    },
    zayavki: function () {
      if (!dogovor()) return verh('Заявки') + zamok('Откроется после договора', 'Первая заявка на приёмку появится здесь после подписания договора.');
      return verh('Заявки', mir() ? { kabinet: 'Оформляете здесь, в кабинете', messenger: 'Уходят сообщением в ' + mess(), manager: 'Оформляет ваш персонаж ' + imya() }[sposob()] : '') +
        '<div class="k2-zg"><div class="kart">' + rForma() + '</div>' + rSpisok() + '</div>';
    },
    vitrina: function () { return fl() ? rObzor() : verh(novaya ? 'Новая карточка' : 'Витрина', novaya ? 'Товар уже лежит на складе: осталось поставить цены' : 'Ваш товар со склада продаётся в Лавке') + rVitrina(); },
    pokupki: function () { return verh('Покупки', 'Купленное в Лавке неделю ждёт на складе бесплатно') + rPokupki(); },
    dengi: function () {
      if (!dogovor()) return verh('Документы и счета') + zamok('Откроется после договора', 'Договор, счета и акты появятся здесь.');
      return verh('Документы и счета') + rDengi();
    },
    svyaz: function () { return verh(mir() ? 'Персонаж' : fl() || pokupatel() ? 'Поддержка' : 'Менеджер') + rSvyaz(); },
    urovni: function () { return mir() ? rUrovni() : rObzor(); },
    nastroyki: function () { return verh('Настройки') + rNastroyki(); }
  };

  function pokaz(r, fokus) {
    document.body.classList.toggle('prosto-vid', !mir());          /* в «Всё просто» и шапка с обычными названиями услуг */
    if (!estRazdel(r)) r = 'obzor';
    if (r !== 'vitrina') novaya = false;
    razdel = r;
    try { history.replaceState(null, '', location.pathname + (novyy ? location.search : '') + '#' + r); } catch (e) {}
    rMenu();
    var ob = box.closest('.kab');
    if (ob) { ob.classList.add('k2'); ob.classList.toggle('kab-vid-mir', mir()); ob.classList.toggle('kab-vid-prosto', !mir()); }
    box.innerHTML = RENDER[r]();
    document.querySelectorAll('.k2-mik[data-ik]').forEach(function (s) { S.ikonka(s, s.getAttribute('data-ik')); });
    var ch = box.querySelector('[data-chat-kab]'); if (ch && window.TuchaChat) TuchaChat.sozdat(ch, { vstroen: true });
    var pk = box.querySelector('[data-pokupki-kab]'); if (pk && L) L.pokupki(pk, pokupatel() ? null : a.profil);
    risovatPr();
    var svg = box.querySelector('#kabScena');
    if (svg) {
      var KUDA = { hranenie: 'sklad', obrabotka: 'zayavki', dostavka: 'zayavki', vitrina: fl() ? 'pokupki' : 'vitrina', tamozhnya: 'svyaz' };
      var sc = S.sozdat(svg, { root: R, onKlik: function (k) { if (k === 'dostavka') forma = 'dostavka'; pokaz(KUDA[k] || 'obzor', true); } }), bl = {};
      var us = a.mir && a.mir.bloki ? Object.keys(a.mir.bloki) : (a.uslugi || ['hranenie']);
      us.concat(['hranenie']).forEach(function (k) { if (S.BLOKI[k]) bl[k] = 1; });
      if (!fl() && a.vitrina && a.vitrina.karty.length) bl.vitrina = 1;
      sc.obnovit(bl, false); sc.persona(a.persona || 'auto'); sc.kanal(kanal());
      if (sc.uroven) { var ui = T.klubUroven(a.staj); sc.uroven(ui, T.KLUB[ui].imya, T.KLUB.length, false); }
    }
    if (fokus) { var h1 = box.querySelector('h1'); if (h1) h1.focus({ preventScroll: true }); window.scrollTo({ top: Math.max(0, box.getBoundingClientRect().top + window.scrollY - 90) }); }
  }

  function modalFoto(i) {
    var p = fl() ? { t: SEYCHAS - 30 * DEN, opis: 'Вещи с ремонта, 3 места', plomba: '0046611', mesto: 'Тёплая зона, 14-16', kadr: 'kadr-prohod.jpg' } : a.priemki[i];
    var m = document.createElement('div');
    m.className = 'k2-modal' + (mir() ? ' k2-modal-mir' : '');
    m.innerHTML = '<div class="k2-modal-o" role="dialog" aria-modal="true" aria-label="Фотоотчёт приёмки"><button type="button" class="k2-x" aria-label="Закрыть">×</button>' +
      '<span class="k2-sohr">' + (mir() ? 'Точка сохранения' : 'Приёмка') + '</span><img src="' + R + 'assets/img/' + p.kadr + '" alt="Фото приёмки: ' + esc(p.opis) + '">' +
      '<h2 class="h3">' + (mir() ? 'Игра сохранена' : 'Паллеты приняты') + '</h2><p class="muted">' + esc(p.opis) + ', ' + dataTxt(p.t) + '</p>' +
      '<div class="k2-f4"><div><small>Пломба</small><b>№ ' + p.plomba + '</b></div><div><small>Место</small><b>' + p.mesto + '</b></div><div><small>Повреждения</small><b>нет</b></div><div><small>Кадров</small><b>2 на паллету</b></div></div></div>';
    document.body.appendChild(m);
    function zakr() { m.remove(); document.removeEventListener('keydown', esc1); }
    function esc1(e) { if (e.key === 'Escape') zakr(); }
    m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('.k2-x')) zakr(); });
    document.addEventListener('keydown', esc1);
    m.querySelector('.k2-x').focus();
  }
  function skachat(chto) {
    if (chto === 'ostatki') {
      var csv = 'Артикул;Товар;Остаток;Ед.;Место\n' + tovary().map(function (t) { return [t.art, t.name, t.ost, t.ed, t.mesto].join(';'); }).join('\n');
      var ssyl = document.createElement('a');
      ssyl.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })); ssyl.download = 'ostatki-tucha.csv'; ssyl.click();
      T.toast('Остатки выгружены таблицей'); return;
    }
    T.toast('В прототипе файлы не формируются: в рабочем кабинете здесь скачается документ');
  }

  menu.addEventListener('click', function (e) {
    var b = e.target.closest('[data-r]');
    if (b) { forma = null; pokaz(b.dataset.r, true); }
  });
  box.addEventListener('click', function (e) {
    var kak = e.target.closest('[data-kak]');
    if (kak) { var sp = box.querySelector('.k2-kak-sp'); sp.hidden = !sp.hidden; kak.setAttribute('aria-expanded', String(!sp.hidden)); return; }
    var t = e.target.closest('button'); if (!t) return;
    var d = t.dataset;
    if (d.idi) pokaz(d.idi, true);
    else if (d.zay) { forma = d.zay; pokaz('zayavki', true); }
    else if (d.tab) { forma = d.tab; pokaz('zayavki'); }
    else if (d.zDalee) { vseZayavki().forEach(function (z) { if (String(z.n) === d.zDalee) z.st = Math.min(ZSTATUS[z.vid].length - 1, z.st + 1); }); sohr(); pokaz('zayavki'); T.toast('Статус обновлён. Отправили вам сообщение'); }
    else if (d.otgruzit) { forma = 'otgruzka'; predTovar = d.otgruzit; pokaz('zayavki', true); }
    else if (d.naVitrinu) { predTovar = d.naVitrinu; pokaz('vitrina'); novaya = true; pokaz('vitrina', true); }
    else if ('nova' in d) { predTovar = ''; novaya = true; pokaz('vitrina', true); }
    else if ('kVitr' in d) { novaya = false; pokaz('vitrina', true); }
    else if (d.vtab) { vitrTab = d.vtab; pokaz('vitrina'); }
    else if (d.ptab) { pokTab = d.ptab; pokaz('pokupki'); }
    else if ('poruchit' in d) { a.vitrina.vedenie = 'pomosh'; sohr(); novaya = false; pokaz('vitrina', true); T.toast(imya() + ' снимет товар на складе и заполнит карточку за 2 рабочих дня. Ведение: «С помощью»'); }
    else if (d.foto !== undefined) modalFoto(+d.foto);
    else if (d.skachat) skachat(d.skachat);
    else if ('sverka' in d) T.toast('Запросили акт сверки: ' + imya() + ' подпишет и выложит в документы');
    else if ('oplatit' in d) { a.oplacheno = new Date().getMonth(); sohr(); pokaz(razdel); T.toast('Оплачено. Чек пришлём на почту'); }
    else if (d.profil) { if (d.profil !== a.profil) { a.profil = d.profil; a.tip = d.profil; forma = null; sohr(); pokaz(razdel, true); T.toast(fl() ? 'Личный кабинет' : 'Бизнес-аккаунт: ' + a.kompaniya); } }
    else if ('lichnyy' in d) { a.lichnyy = true; a.profil = 'fl'; a.tip = 'fl'; sohr(); pokaz('obzor', true); T.toast('Личный профиль добавлен: покупки и вещи на вас лично'); }
    else if ('privetOk' in d) { novyy = null; try { history.replaceState(null, '', location.pathname + '#' + razdel); } catch (e2) {} pokaz(razdel); }
    else if ('demoStatus' in d) { a.status = Math.min(4, (a.status || 0) + 1); sohr(); pokaz(razdel); T.toast('Статус обновлён'); }
    else if ('vyyti' in d) { T.vyyti(); location.href = R + (T.v2() ? 'v2/' : '') + 'vhod/'; }
    else if ('steret' in d) { ['tucha.akk', 'tucha.sessiya', 'tucha.mir', 'tucha.metki', 'tucha.zakazy', 'tucha.vitrina', 'tucha.korzina'].forEach(T.st.del); location.href = R + (T.v2() ? 'v2/' : ''); }
  });
  box.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.matches('form[data-zayavka]')) { e.preventDefault(); otpravit(f); }
    else if (f.matches('form[data-karta]')) {
      e.preventDefault();
      var fd = new FormData(f), nm = String(fd.get('name') || '').trim();
      if (nm.length < 2) { T.toast('Напишите название'); f.querySelector('#k-name').focus(); return; }
      a.vitrina.karty.push({ art: fd.get('art'), name: nm, na: +fd.get('na') || 1, st: 'proverka' });
      sohr(); novaya = false; pokaz('vitrina', true); T.toast('Карточка на проверке: ' + imya() + ' посмотрит товар и позвонит. После проверки она появится в Лавке');
    }
    else if (f.matches('form[data-org]')) {
      e.preventDefault();
      var inn = String(new FormData(f).get('inn') || '').replace(/\D/g, '');
      if (!T.innOk(inn)) { T.toast('Проверьте ИНН: 10 цифр у компании или 12 у ИП'); return; }
      a.inn = inn; a.kompaniya = inn.length === 12 ? 'ИП (по ИНН ' + inn + ')' : 'ООО (по ИНН ' + inn + ')'; a.profil = 'ul'; a.tip = 'ul'; sohr(); pokaz('obzor', true);
      T.toast('Организация добавлена: название и адрес подставим по ИНН');
    }
  });
  box.addEventListener('input', function (e) { if (e.target.closest('form[data-karta]')) risovatPr(); });
  box.addEventListener('change', function (e) {
    var t = e.target;
    if (t.closest('form[data-karta]')) {
      if (t.name === 'art') { var tv = tovary().filter(function (x) { return x.art === t.value; })[0]; if (tv) { box.querySelector('#k-name').value = tv.name; box.querySelector('#k-art').value = tv.art; } }
      risovatPr(); return;
    }
    if (t.name === 'mashina') { var pp = box.querySelector('[data-poputki]'); if (pp) pp.hidden = t.value !== 'попутка'; }
    else if (/^my-/.test(t.name)) {          /* мои данные: сохраняем сразу */
      if (t.name === 'my-tel' && !T.telOk(t.value)) { T.toast('Телефон: нужно 11 цифр'); t.value = a.tel || ''; return; }
      if (t.name === 'my-pochta' && t.value.trim() && !T.pochtaOk(t.value)) { T.toast('Проверьте почту'); t.value = a.pochta || ''; return; }
      a[t.name.slice(3)] = t.value.trim(); sohr(); T.toast('Сохранено'); }
    else if (t.name === 'vid') { a.vid = t.value; sohr(); pokaz('nastroyki'); T.toast(mir() ? 'Формат: Мир Тучи' : 'Формат: Всё просто'); }
    else if (t.name === 'kanal') { a.kanal = t.value; sohr(); var m = box.querySelector('[data-mess]'); if (m) m.hidden = t.value !== 'messenger'; T.toast('Сохранено'); }
    else if (t.name === 'messenger') { a.messenger = t.value; sohr(); T.toast('Сохранено'); }
    else if (t.name === 'sposob') { a.zayavkiSposob = t.value; sohr(); T.toast({ kabinet: 'Заявки: в кабинете', messenger: 'Заявки: сообщением в ' + mess(), manager: 'Заявки: через персонажа' }[t.value]); }
    else if (t.name === 'harakter' || t.name === 'pol') {          /* новый персонаж: имя своего пола, постройка и история остаются */
      var bylo = imya(), pol = t.name === 'pol' ? t.value : polPers();
      if (t.name === 'harakter') a.persona = t.value;
      a.manager = IMENA[pol].filter(function (x) { return x !== bylo; })[0]; sohr(); pokaz('nastroyki');
      T.toast('Персонаж сменён: ' + a.manager + '. Постройка и история остались'); }
    else if (t.name === 'rezerv') { a.rezerv = +t.value; sohr(); T.toast(+t.value ? 'Резервация на ' + t.value + ' ' + mes(+t.value) + ': скидка в счёте' : 'Оплата по факту'); }
    else if (t.name === 'vedenie') { a.vitrina.vedenie = t.value; sohr(); pokaz('vitrina'); T.toast('Ведение сменится с первого числа'); }
  });
  document.addEventListener('click', function (e) {
    var sp = box.querySelector('.k2-kak-sp');
    if (sp && !sp.hidden && !e.target.closest('.k2-kak')) { sp.hidden = true; var b = box.querySelector('[data-kak]'); if (b) b.setAttribute('aria-expanded', 'false'); }
  });

  pokaz(razdel);
})();
