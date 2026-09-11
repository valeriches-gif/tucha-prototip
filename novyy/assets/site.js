/* Общее для всех страниц: шапка, меню, хранилище, уведомления, проверки,
   экран кода, метки «Добавить в мой мир», лист ожидания, «Перезвоните».
   Сервера пока нет: аккаунт и анкета живут в браузере, код — демо. */
window.Tucha = (function () {
  var ROOT = window.TUCHA_ROOT || './';
  var DEMO_KOD = '1234';
  var NAZV = {
    hranenie: 'Точка сохранения', obrabotka: 'Мастерская', lavka: 'Лавка',
    vitrina: 'Витрина', dostavka: 'Телепорт', tamozhnya: 'Портал'
  };

  var st = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  function goal(n) {
    try { if (window.ym && window.YM_ID) window.ym(window.YM_ID, 'reachGoal', n); } catch (e) {}
    if (window.console) console.log('[цель Метрики]', n);
  }

  var toastEl, toastTm;
  function toast(t, o) {
    o = o || {};
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.className = 'toast' + (o.osh ? ' osh' : '');
    toastEl.innerHTML = '';
    var s = document.createElement('span'); s.textContent = t; toastEl.appendChild(s);
    if (o.deystvie) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = o.deystvie;
      b.onclick = function () { toastEl.classList.remove('vid'); o.onClick && o.onClick(); };
      toastEl.appendChild(b);
    }
    if (o.osh) {
      var x = document.createElement('button'); x.type = 'button'; x.textContent = '✕'; x.setAttribute('aria-label', 'Закрыть');
      x.onclick = function () { toastEl.classList.remove('vid'); }; toastEl.appendChild(x);
    }
    requestAnimationFrame(function () { toastEl.classList.add('vid'); });
    clearTimeout(toastTm);
    if (!o.osh) toastTm = setTimeout(function () { toastEl.classList.remove('vid'); }, o.ms || 4000);
  }

  /* ИНН: 10 цифр — компания, 12 — ИП. Контрольные цифры ловят опечатки. */
  function innOk(v) {
    var d = String(v || '').replace(/\D/g, '');
    function ks(w, n) { var s = 0; for (var i = 0; i < w.length; i++) s += w[i] * +d[i]; return (s % 11) % 10 === +d[n]; }
    if (d.length === 10) return ks([2, 4, 10, 3, 5, 9, 4, 6, 8], 9);
    if (d.length === 12) return ks([7, 2, 4, 10, 3, 5, 9, 4, 6, 8], 10) && ks([3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8], 11);
    return false;
  }
  function telOk(v) { return String(v || '').replace(/\D/g, '').length === 11; }
  function pochtaOk(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim()); }
  function telFormat(v) {
    var d = String(v || '').replace(/\D/g, '');
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    var r = '+7';
    if (d.length > 1) r += ' (' + d.slice(1, 4);
    if (d.length >= 4) r += ')';
    if (d.length > 4) r += ' ' + d.slice(4, 7);
    if (d.length > 7) r += '-' + d.slice(7, 9);
    if (d.length > 9) r += '-' + d.slice(9, 11);
    return r;
  }
  function maska(inp) {
    inp.addEventListener('input', function () { if (inp.value.replace(/\D/g, '').length) inp.value = telFormat(inp.value); });
    inp.addEventListener('focus', function () { if (!inp.value) inp.value = '+7 ('; });
    inp.addEventListener('blur', function () { if (inp.value.replace(/\D/g, '').length <= 1) inp.value = ''; });
  }

  function metki() {
    var m = st.get('tucha.metki') || [], now = Date.now();
    return m.filter(function (x) { return now - x.t < 7 * 864e5 && NAZV[x.b]; }).map(function (x) { return x.b; });
  }
  function dobMetku(b) {
    var m = (st.get('tucha.metki') || []).filter(function (x) { return x.b !== b; });
    m.push({ b: b, t: Date.now() }); st.set('tucha.metki', m);
  }

  /* корзина Лавки: число позиций у значка в шапке */
  function korzN() { return (st.get('tucha.korzina') || []).filter(function (x) { return x.q > 0; }).length; }
  function korzObnovit(bump) {
    var n = korzN();
    document.querySelectorAll('[data-korz-n]').forEach(function (b) {
      b.textContent = n; b.hidden = !n;
      if (bump && n) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
    });
  }

  function akk() { return st.get('tucha.akk'); }
  function sessiya() { var s = st.get('tucha.sessiya'); return !!(s && akk() && Date.now() - s.t < 30 * 864e5); }
  function voyti() { st.set('tucha.sessiya', { t: Date.now() }); }
  function vyyti() { st.del('tucha.sessiya'); }

  function anketa() {
    var s = st.get('tucha.mir');
    return (s && s.v === 1 && Date.now() - s.t < 30 * 864e5) ? s : null;
  }

  /* Экран кода: 4 клетки, повтор через 60 с, 5 попыток — пауза 15 минут. */
  function kodEkran(box, o) {
    box.innerHTML =
      '<h2 style="font-size:28px">Введите код</h2>' +
      '<p class="muted">Отправили на ' + o.kuda + '</p>' +
      '<div class="kod" role="group" aria-label="Код из четырёх цифр">' +
      '<input inputmode="numeric" maxlength="1" aria-label="Цифра 1" autocomplete="one-time-code">' +
      '<input inputmode="numeric" maxlength="1" aria-label="Цифра 2"><input inputmode="numeric" maxlength="1" aria-label="Цифра 3">' +
      '<input inputmode="numeric" maxlength="1" aria-label="Цифра 4"></div>' +
      '<p><span class="demo">Демо: SMS пока не отправляются, код: ' + DEMO_KOD + '</span></p>' +
      '<p class="osh-k" aria-live="polite"></p>' +
      '<p><button class="btn-t" type="button" data-povtor disabled>Отправить ещё раз через 60 с</button></p>' +
      '<p class="muted" style="font-size:14px">Не пришёл код? Позвоните: <a href="tel:+74956658242">+7 (495) 665-82-42</a></p>' +
      (o.nazad ? '<p><button class="btn-t" type="button" data-nazad>Изменить данные</button></p>' : '');
    var inp = box.querySelectorAll('.kod input'), osh = box.querySelector('.osh-k'), pov = box.querySelector('[data-povtor]');
    var sek = 60, tm;
    function tik() {
      clearInterval(tm); sek = 60; pov.disabled = true;
      tm = setInterval(function () {
        sek--; pov.textContent = sek > 0 ? 'Отправить ещё раз через ' + sek + ' с' : 'Отправить ещё раз';
        if (sek <= 0) { clearInterval(tm); pov.disabled = false; }
      }, 1000);
    }
    tik();
    pov.onclick = function () {
      var p = (st.get('tucha.kodpovt') || []).filter(function (t) { return Date.now() - t < 3600e3; });
      if (p.length >= 5) { osh.textContent = 'Код можно запросить не больше пяти раз в час. Позвоните нам: +7 (495) 665-82-42'; return; }
      p.push(Date.now()); st.set('tucha.kodpovt', p); tik(); toast('Код отправлен');
    };
    if (o.nazad) box.querySelector('[data-nazad]').onclick = o.nazad;
    function proverit() {
      var kod = Array.prototype.map.call(inp, function (i) { return i.value; }).join('');
      if (kod.length < 4) return;
      var blok = st.get('tucha.kodblok');
      if (blok && Date.now() < blok) {
        osh.textContent = 'Слишком много попыток. Попробуйте через ' + Math.ceil((blok - Date.now()) / 60000) + ' мин или позвоните: +7 (495) 665-82-42';
        return;
      }
      if (kod === DEMO_KOD) { st.del('tucha.kodpop'); clearInterval(tm); o.onOk(); return; }
      var pop = (st.get('tucha.kodpop') || 0) + 1; st.set('tucha.kodpop', pop);
      Array.prototype.forEach.call(inp, function (i) { i.value = ''; }); inp[0].focus();
      if (pop >= 5) { st.set('tucha.kodblok', Date.now() + 15 * 60000); st.del('tucha.kodpop'); osh.textContent = 'Слишком много попыток. Попробуйте через 15 минут или позвоните: +7 (495) 665-82-42'; }
      else osh.textContent = 'Неверный код. Осталось попыток: ' + (5 - pop);
    }
    Array.prototype.forEach.call(inp, function (i, n) {
      i.addEventListener('input', function () {
        var d = i.value.replace(/\D/g, '');
        if (d.length > 1) { d.split('').slice(0, 4 - n).forEach(function (c, j) { inp[n + j].value = c; }); inp[Math.min(3, n + d.length - 1)].focus(); }
        else { i.value = d; if (d && n < 3) inp[n + 1].focus(); }
        proverit();
      });
      i.addEventListener('keydown', function (e) { if (e.key === 'Backspace' && !i.value && n > 0) inp[n - 1].focus(); });
    });
    inp[0].focus();
  }

  function kogdaSvyazhetsya() {
    var d = new Date(), den = d.getDay(), h = d.getHours();
    if (den >= 1 && den <= 5 && h >= 9 && h < 18) return 'в течение двух часов';
    var n = new Date(d);
    if (!(den >= 1 && den <= 5 && h < 9)) { do { n.setDate(n.getDate() + 1); } while (n.getDay() === 0 || n.getDay() === 6); }
    var dni = ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'];
    var d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate()), n0 = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    var raz = Math.round((n0 - d0) / 864e5);
    return 'до 12:00 ' + (raz === 0 ? 'сегодня' : raz === 1 ? 'завтра' : 'в ' + dni[n.getDay()]);
  }
  /* «Анна позвонит вам в течение двух часов» — одно правило для игры и кабинета */
  function kakSvyazhetsya(k, mess) {
    var kogda = kogdaSvyazhetsya();
    if (k === 'pochta') return 'напишет вам ' + kogda;
    if (k === 'messenger') return 'напишет вам в ' + (mess || 'мессенджер') + ' ' + kogda;
    if (k === 'vstrecha') return 'свяжется с вами ' + kogda + ', чтобы договориться о встрече';
    if (k === 'chat') return 'подключится к чату ' + kogda + ', а помощник на связи уже сейчас';
    return 'позвонит вам ' + kogda;
  }

  /* ---------- поведение страницы ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var sh = document.getElementById('shapka');
    if (sh) {
      var burger = sh.querySelector('[data-burger]');
      burger && burger.addEventListener('click', function () {
        var o = sh.classList.toggle('open'); burger.setAttribute('aria-expanded', o);
      });
      var mu = sh.querySelector('[data-menu-u]');
      mu && mu.addEventListener('click', function () {
        var o = mu.parentNode.classList.toggle('open'); mu.setAttribute('aria-expanded', o);
      });
      document.addEventListener('click', function (e) { if (mu && !mu.parentNode.contains(e.target)) mu.parentNode.classList.remove('open'); });
      var dozor = document.createElement('div');
      dozor.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:40px;pointer-events:none';
      document.body.prepend(dozor);
      if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { sh.classList.toggle('mini', !e[0].isIntersecting); }).observe(dozor);
      if (sessiya()) sh.querySelectorAll('[data-vhod]').forEach(function (a) { a.textContent = 'Кабинет'; a.href = ROOT + 'kabinet/'; });
    }
    korzObnovit();

    document.querySelectorAll('[data-dobavit]').forEach(function (b) {
      b.addEventListener('click', function () { var k = b.getAttribute('data-dobavit'); dobMetku(k); goal('dobavit_' + k); location.href = ROOT + 'start/'; });
    });

    document.querySelectorAll('[data-vybrali]').forEach(function (e) {
      var m = metki();
      if (m.length) { e.hidden = false; e.textContent = 'Вы выбрали: ' + m.map(function (k) { return NAZV[k]; }).join(', '); }
    });

    document.querySelectorAll('[data-resume]').forEach(function (e) {
      var a = anketa();
      if (!a || a.shag === 'intro' || a.done) return;
      e.innerHTML = '<div class="plashka"><p>Вы начали собирать свой мир. Продолжить?</p>' +
        '<a class="btn btn-sm" href="' + ROOT + 'start/mir/?prodolzhit=1">Продолжить</a>' +
        '<button class="btn-t" type="button">Начать заново</button></div>';
      e.querySelector('button').onclick = function () { st.del('tucha.mir'); e.innerHTML = ''; toast('Анкета очищена'); };
    });

    var rb = document.querySelector('[data-rasshifr]'), rt = document.querySelector('[data-rasshifr-t]');
    rb && rb.addEventListener('click', function () {
      var o = rb.getAttribute('aria-expanded') !== 'true';
      rb.setAttribute('aria-expanded', o);
      rt.innerHTML = o ? '<b>Т</b>ехнологичная <b>У</b>никальная <b>Ч</b>удо-<b>А</b>рхитектура' : '';
    });

    document.querySelectorAll('form[data-list]').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var p = f.querySelector('[type=email]'), s = f.querySelector('[type=checkbox]'), ok = true;
        p.closest('.pole').classList.toggle('osh', !pochtaOk(p.value)); if (!pochtaOk(p.value)) ok = false;
        s.closest('.pole').classList.toggle('osh', !s.checked); if (!s.checked) ok = false;
        if (!ok) return;
        var l = st.get('tucha.list') || []; var rol = f.querySelector('[name=rol]:checked');
        l.push({ p: p.value.trim(), rol: rol ? rol.value : 'pokupatel', t: Date.now() }); st.set('tucha.list', l);
        goal('lavka_wait');
        f.innerHTML = '<div class="gotovo"><b>Готово</b>Напишем, когда Лавка откроется.</div>';
      });
    });

    document.querySelectorAll('form[data-perezvon]').forEach(function (f) {
      var t = f.querySelector('[type=tel]'); t && maska(t);
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var im = f.querySelector('[name=imya]'), s = f.querySelector('[type=checkbox]'), ok = true;
        [[im, im.value.trim().length > 1], [t, telOk(t.value)], [s, s.checked]].forEach(function (x) {
          x[0].closest('.pole').classList.toggle('osh', !x[1]); if (!x[1]) ok = false;
        });
        if (!ok) return;
        goal('perezvon');
        f.innerHTML = '<div class="gotovo"><b>Спасибо</b>Перезвоним ' + kogdaSvyazhetsya() + '.</div>';
      });
    });

    var pv = document.querySelector('[data-poisk]');
    pv && pv.addEventListener('input', function () {
      var q = pv.value.trim().toLowerCase();
      document.querySelectorAll('.voprosy details').forEach(function (d) {
        d.hidden = q && d.textContent.toLowerCase().indexOf(q) < 0;
        if (q && !d.hidden) d.open = true;
      });
      document.querySelectorAll('.gruppa-v').forEach(function (g) {
        var sp = g.nextElementSibling; g.hidden = q && !sp.querySelector('details:not([hidden])');
      });
      var nich = document.querySelector('[data-nichego]');
      if (nich) nich.hidden = !q || !!document.querySelector('.voprosy details:not([hidden])');
    });

    var pom = document.querySelector('[data-pomosh]'), pp = document.querySelector('.pomosh-panel'),
      pbox = document.querySelector('[data-pomosh-box]');
    function zakrytPomosh() { pp.classList.remove('vid'); pom.setAttribute('aria-expanded', false); pom.focus(); }
    pom && pom.addEventListener('click', function () {
      var o = pp.classList.toggle('vid'); pom.setAttribute('aria-expanded', o);
      if (!o) return;
      goal('pomosh_open');
      var cb = pp.querySelector('[data-chat-box]');
      if (window.TuchaChat && cb && !cb.dataset.gotov) {
        cb.dataset.gotov = 1;
        TuchaChat.sozdat(cb, { zakryt: zakrytPomosh, fokus: true,
          niz: 'Живой человек: <a href="tel:+74956658242">+7 (495) 665-82-42</a> · <a href="https://t.me/tucha_ml">Telegram</a>' });
      }
    });

    /* калькулятор хранения — для тех, кто хочет цифру без игры */
    document.querySelectorAll('form[data-kalk]').forEach(function (f) {
      var SK = { 0: 0, 1: 15, 2: 20, 3: 30 };
      function schet() {
        var p = Math.max(1, Math.min(3000, parseInt(f.elements.pal.value, 10) || 1));
        var s = +((f.querySelector('[name=srok]:checked') || {}).value || 0);
        var n = p % 100, m = n % 10, sl = n > 10 && n < 20 ? 'паллет' : m === 1 ? 'паллета' : m > 1 && m < 5 ? 'паллеты' : 'паллет';
        f.querySelector('[data-kalk-sum]').textContent = Math.round(p * 16.42 * 30 * (1 - SK[s] / 100)).toLocaleString('ru-RU') + ' ₽';
        f.querySelector('[data-kalk-pod]').textContent = p + ' ' + sl + ' × 16,42 ₽ × 30 дней' + (SK[s] ? ', скидка ' + SK[s] + ' %' : '');
        f.querySelector('[data-kalk-zayavka]').href = ROOT + 'start/prosto/?kalk=' + p + '-' + s;
      }
      f.addEventListener('input', schet);
      f.addEventListener('change', schet);
      f.addEventListener('submit', function (e) { e.preventDefault(); });
      f.querySelector('[data-kalk-zayavka]').addEventListener('click', function () { goal('kalk_zayavka'); });
      schet();
    });
    var px = document.querySelector('[data-pomosh-x]');
    if (pbox && st.get('tucha.bezPomoshi')) pbox.classList.add('skryta');
    px && px.addEventListener('click', function () {
      pbox.classList.add('skryta'); pp.classList.remove('vid'); st.set('tucha.bezPomoshi', 1);
      toast('Помощник убран. Телефон: в шапке и подвале');
    });
    /* у подвала помощник уходит, чтобы не закрывать телефон и адрес */
    var podval = document.querySelector('.podval');
    if (pbox && podval && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        pbox.classList.toggle('u-podvala', e[0].isIntersecting);
        if (e[0].isIntersecting) pp.classList.remove('vid');
      }).observe(podval);
    }
    document.querySelectorAll('[data-goal]').forEach(function (a) { a.addEventListener('click', function () { goal(a.getAttribute('data-goal')); }); });

    /* разделы появляются при прокрутке, цифры считаются — через IntersectionObserver, без обработчика scroll */
    var tiho = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var SETKI = '.setka, .dve-dorogi, .shagi, .kluch, .foto-setka, .klassy, .puti, .fakty';
    if (!tiho && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('vidno');
          io.unobserve(e.target);
          e.target.querySelectorAll('[data-schet]').forEach(schitat);
          if (e.target.hasAttribute('data-schet')) schitat(e.target);
        });
      }, { rootMargin: '0px 0px -6% 0px' });
      var kandidaty = [];
      document.querySelectorAll('main .sek .wrap > *, main .sek-t .wrap > *').forEach(function (el) { if (!el.matches(SETKI) && !el.matches('img')) kandidaty.push(el); });
      document.querySelectorAll('main .foto-r, main .usl-foto, main .hran-hero-foto img, main .doroga-ill img').forEach(function (im) {
        im.classList.add('otkr-foto');
        io.observe(im);
      });
      document.querySelectorAll(SETKI.split(', ').map(function (s) { return 'main ' + s + ' > *'; }).join(', ')).forEach(function (el) { kandidaty.push(el); });
      kandidaty.forEach(function (el) {
        if (el.closest('.igra, .hero-mir') || (el.parentElement && el.parentElement.closest('.otkr'))) return;
        el.classList.add('otkr');
        el.style.setProperty('--i', Array.prototype.indexOf.call(el.parentElement.children, el) % 6);
        io.observe(el);
      });
    }
    function schitat(b) {
      var m = /^(\D*)([\d\s]+(?:,\d+)?)(.*)$/.exec(b.getAttribute('data-schet') || '');
      if (!m) return;
      var cel = parseFloat(m[2].replace(/\s/g, '').replace(',', '.')), drob = m[2].indexOf(',') >= 0, t0 = null;
      function k(now) {
        if (t0 === null) t0 = now;
        var t = Math.min(1, (now - t0) / 1100), v = cel * (1 - Math.pow(1 - t, 3));
        b.textContent = m[1] + (drob ? v.toFixed(1).replace('.', ',') : Math.round(v).toLocaleString('ru-RU')) + m[3];
        if (t < 1) requestAnimationFrame(k);
      }
      requestAnimationFrame(k);
    }
  });

  return {
    ROOT: ROOT, NAZV: NAZV, st: st, goal: goal, toast: toast, innOk: innOk, telOk: telOk, pochtaOk: pochtaOk,
    telFormat: telFormat, maska: maska, metki: metki, dobMetku: dobMetku, akk: akk, sessiya: sessiya,
    voyti: voyti, vyyti: vyyti, anketa: anketa, kodEkran: kodEkran, kogdaSvyazhetsya: kogdaSvyazhetsya,
    kakSvyazhetsya: kakSvyazhetsya, korzObnovit: korzObnovit
  };
})();
