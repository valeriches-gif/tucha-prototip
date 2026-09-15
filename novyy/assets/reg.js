/* Форма регистрации: простая форма целиком и короткая — в конце «Мира Тучи».
   Поле проверяется, когда из него уходят, и все — при нажатии «Получить код».
   Первое поле с ошибкой получает фокус. Дальше — экран кода. */
window.TuchaReg = (function () {
  var T = window.Tucha;
  var USLUGI = [
    ['hranenie', 'Хранение'], ['obrabotka', 'Обработка'],          /* форма «Всё просто»: обычные названия, без игровых */
    ['dostavka', 'Доставка'], ['tamozhnya', 'Таможня'],
    ['vitrina', 'Витрина']
  ];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function forma(box, o) {
    o = o || {};
    var p = o.predzapolnit || {}, R = T.ROOT, fl = p.tip === 'fl';
    if (!p.tel && !p.pochta) { try { var sVhoda = sessionStorage.getItem('tucha.vhod'); if (sVhoda) { p = Object.assign({}, p); if (/@/.test(sVhoda)) p.pochta = sVhoda; else p.tel = sVhoda; } } catch (e) {} }   /* номер, который вводили на входе */
    /* юрлицо или ИП — с ИНН и названием; физическое лицо — без ИНН, с ФИО */
    var h = '<form novalidate class="reg">' +
      '<fieldset class="pole reg-tip"><legend>Вы регистрируетесь как</legend><div class="vybor">' +
      '<label><input type="radio" name="r-tip" value="ul"' + (fl ? '' : ' checked') + '><span>Юрлицо или ИП</span></label>' +
      '<label><input type="radio" name="r-tip" value="fl"' + (fl ? ' checked' : '') + '><span>Физическое лицо</span></label></div></fieldset>' +
      '<div class="pole" data-p="inn" data-ul><label for="r-inn">ИНН</label>' +
      '<input id="r-inn" type="text" inputmode="numeric" maxlength="12" autocomplete="off" value="' + esc(p.inn) + '">' +
      '<p class="podskaz">10 цифр у компании, 12 у ИП</p><p class="osh-t">Проверьте ИНН: 10 цифр у компании или 12 у ИП</p></div>' +
      '<div data-est-akk hidden class="plashka"><p>С этим ИНН уже есть аккаунт. Войти или написать нам?</p>' +
      '<a class="btn btn-sm" href="' + R + (T.v2() ? 'v2/' : '') + 'vhod/">Войти</a><a class="btn-t" href="https://t.me/tucha_ml">Написать нам</a></div>' +
      (o.kratko ? '<div class="pole" data-p="imya" data-fl><label for="r-imya">ФИО</label>' +
      '<input id="r-imya" type="text" maxlength="80" autocomplete="name" value="' + esc(p.imya) + '">' +
      '<p class="osh-t">Впишите фамилию и имя</p></div>' :
      '<div class="pole" data-p="kompaniya" data-ul><label for="r-komp">Название компании или ИП</label>' +
      '<input id="r-komp" type="text" maxlength="160" autocomplete="organization" value="' + esc(p.kompaniya) + '">' +
      '<p class="podskaz">В рабочей версии подставится само по ИНН из справочника компаний</p>' +
      '<p class="osh-t">Впишите название компании или ИП</p></div>' +
      '<div class="pole" data-p="imya"><label for="r-imya" data-imya-l>Как к вам обращаться</label>' +
      '<input id="r-imya" type="text" maxlength="80" autocomplete="name" value="' + esc(p.imya) + '">' +
      '<p class="osh-t" data-imya-osh>Как к вам обращаться?</p></div>') +
      '<div class="pole" data-p="tel"><label for="r-tel">Телефон</label>' +
      '<input id="r-tel" type="tel" autocomplete="tel" value="' + esc(p.tel) + '">' +
      '<p class="podskaz">На него придёт код</p><p class="osh-t">Не хватает цифр в номере</p></div>' +
      (o.kratko ? '' : '<div class="pole" data-p="pochta"><label for="r-pochta">Почта <span class="nb">необязательно, для счетов и документов</span></label>' +
      '<input id="r-pochta" type="email" autocomplete="email" value="' + esc(p.pochta) + '">' +
      '<p class="osh-t">Похоже, в адресе опечатка</p></div>');
    if (o.uslugi) {
      var otm = o.otmecheny || [];
      h += '<fieldset class="pole"><legend>Какие услуги интересны <span class="nb">необязательно</span></legend><div class="vybor">' +
        USLUGI.map(function (u) {
          return '<label><input type="checkbox" name="usl" value="' + u[0] + '"' + (otm.indexOf(u[0]) >= 0 ? ' checked' : '') + '>' +
            '<span>' + u[1] + '</span></label>';
        }).join('') + '</div><p class="podskaz" data-skoro-pod hidden>Витрина работает: расскажем при звонке, как выставить ваш товар в Лавке</p></fieldset>';
    }
    if (o.kommentariy) {
      h += '<div class="pole"><label for="r-kom">Комментарий <span class="nb">необязательно</span></label>' +
        '<textarea id="r-kom" maxlength="500" placeholder="Что везёте и сколько">' + esc(p.kommentariy) + '</textarea></div>';
    }
    h += '<div class="pole" data-p="soglasie"><label class="galka"><input type="checkbox" id="r-sogl">' +
      '<span>Согласен на обработку персональных данных, <a href="' + R + 'dokumenty/#soglasie" target="_blank">текст согласия</a></span></label>' +
      '<p class="osh-t">Без согласия мы не можем сохранить данные</p></div>' +
      '<button class="btn" type="submit">' + (o.knopka || 'Получить код') + '</button></form>';
    box.innerHTML = h;

    var f = box.querySelector('form'), el = function (id) { return box.querySelector(id); };
    var inn = el('#r-inn'), komp = el('#r-komp'), imya = el('#r-imya'), tel = el('#r-tel'), pochta = el('#r-pochta'), sogl = el('#r-sogl');
    T.maska(tel);
    if (tel.value) tel.value = T.telFormat(tel.value);
    inn.addEventListener('input', function () { inn.value = inn.value.replace(/\D/g, ''); });
    function tip() { var r = box.querySelector('[name=r-tip]:checked'); return r ? r.value : 'ul'; }
    function fiz() { return tip() === 'fl'; }
    /* поля другого типа прячем и снимаем с них ошибки: физлицу не нужны ИНН и название */
    function podTip() {
      box.querySelectorAll('[data-ul]').forEach(function (e) { e.hidden = fiz(); if (fiz()) e.classList.remove('osh'); });
      box.querySelectorAll('[data-fl]').forEach(function (e) { e.hidden = !fiz(); if (!fiz()) e.classList.remove('osh'); });
      if (fiz()) el('[data-est-akk]').hidden = true;
      var il = box.querySelector('[data-imya-l]'), io = box.querySelector('[data-imya-osh]');
      if (il) il.textContent = fiz() ? 'ФИО' : 'Как к вам обращаться';
      if (io) io.textContent = fiz() ? 'Впишите фамилию и имя' : 'Как к вам обращаться?';
    }
    box.querySelectorAll('[name=r-tip]').forEach(function (r) { r.addEventListener('change', podTip); });
    podTip();
    var pr = {
      inn: function () { return fiz() || T.innOk(inn.value.replace(/\D/g, '')); },
      kompaniya: function () { return !komp || fiz() || komp.value.trim().length > 1; },
      imya: function () { return !imya || (o.kratko && !fiz()) || imya.value.trim().length > (fiz() ? 2 : 0); },
      tel: function () { return T.telOk(tel.value); },
      pochta: function () { return !pochta || !pochta.value.trim() || T.pochtaOk(pochta.value); },
      soglasie: function () { return sogl.checked; }
    };
    if (o.kratko) { delete pr.kompaniya; delete pr.pochta; }
    function pokazat(k) { var ok = pr[k](); box.querySelector('[data-p="' + k + '"]').classList.toggle('osh', !ok); return ok; }
    [[inn, 'inn'], [komp, 'kompaniya'], [imya, 'imya'], [tel, 'tel'], [pochta, 'pochta']].filter(function (x) { return x[0]; }).forEach(function (x) {
      x[0].addEventListener('blur', function () { if (x[0].value) pokazat(x[1]); });
      x[0].addEventListener('input', function () { var b = box.querySelector('[data-p="' + x[1] + '"]'); if (b.classList.contains('osh')) pokazat(x[1]); });
    });
    sogl.addEventListener('change', function () { pokazat('soglasie'); });
    var skPod = box.querySelector('[data-skoro-pod]');
    function skoroPod() {
      if (!skPod) return;
      skPod.hidden = !box.querySelector('[name=usl][value=vitrina]:checked');
    }
    box.querySelectorAll('[name=usl]').forEach(function (c) { c.addEventListener('change', skoroPod); });
    skoroPod();

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var pervaya = null;
      Object.keys(pr).forEach(function (k) { if (!pokazat(k) && !pervaya) pervaya = k; });
      /* номер или ИНН уже есть, а не вошли: предлагаем войти, второй аккаунт не заводим */
      var akk = T.akk(), cif = function (x) { return String(x || '').replace(/\D/g, ''); };
      var dublInn = !fiz() && !!akk && !!akk.inn && akk.inn === cif(inn.value);
      var dubl = !T.sessiya() && !!akk && (dublInn || (!!akk.tel && cif(akk.tel).slice(-10) === cif(tel.value).slice(-10)));
      el('[data-est-akk] p').textContent = dublInn ? 'С этим ИНН уже есть аккаунт. Войти или написать нам?' : 'С этим номером уже есть аккаунт. Войти или написать нам?';
      el('[data-est-akk]').hidden = !dubl;
      if (pervaya) { box.querySelector('[data-p="' + pervaya + '"] input').focus(); return; }
      if (dubl) { (dublInn ? inn : tel).focus(); return; }
      var d = {
        tip: tip(), inn: fiz() ? '' : inn.value.replace(/\D/g, ''),
        kompaniya: fiz() ? 'Частное лицо' : komp ? komp.value.trim() : 'Компания по ИНН ' + inn.value.replace(/\D/g, ''),
        imya: imya ? imya.value.trim() : '', tel: tel.value, pochta: pochta ? pochta.value.trim() : '',
        uslugi: Array.prototype.map.call(box.querySelectorAll('[name=usl]:checked'), function (c) { return c.value; }),
        kommentariy: box.querySelector('#r-kom') ? box.querySelector('#r-kom').value.trim() : ''
      };
      var btn = f.querySelector('[type=submit]'); btn.classList.add('idet'); btn.textContent = 'Отправляем код…';
      setTimeout(function () {
        o.pered && o.pered(d);
        T.kodEkran(box, {
          kuda: d.tel,
          nazad: function () { forma(box, Object.assign({}, o, { predzapolnit: d, otmecheny: d.uslugi })); },
          onOk: function () { o.onOk(d); }
        });
        T.toast('Код отправлен');
      }, 650);
    });
  }

  function sozdatAkk(d, dop) {
    var akk = Object.assign({
      tip: d.tip || 'ul', inn: d.inn, kompaniya: d.kompaniya, imya: d.imya, tel: d.tel, pochta: d.pochta,
      uslugi: d.uslugi || [], kommentariy: d.kommentariy || '', status: 0, sozdan: Date.now(),
      manager: 'Анна', dost: []
    }, dop || {});
    var bylo = T.sessiya() ? T.akk() : null;          /* покупатель из Лавки дописывает хранение: личный профиль и покупки остаются */
    if (bylo && !bylo.put) { akk.lichnyy = !!(bylo.lichnyy || bylo.tip === 'fl'); akk.pokupatel = true; }
    akk.vid = akk.vid || akk.put;
    T.st.set('tucha.akk', akk);
    T.voyti();
    T.goal('code_ok');
    return akk;
  }

  return { forma: forma, sozdatAkk: sozdatAkk, USLUGI: USLUGI, esc: esc };
})();
