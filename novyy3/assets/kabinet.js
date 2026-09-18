/* старый кабинет заменён новым (kabinet2.js); если браузер открыл страницу из кэша, перезагружаем её свежей */
(function () { location.replace(location.pathname + '?obnov=' + Date.now() + location.hash); })();
