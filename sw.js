var CACHE = 'shiftcal-20261119a';
var CORE = ["./","index.html","iphone-alarm.html","manifest.webmanifest","icon.svg","icon-180.png","icon-192.png","icon-512.png","badge-96.png"];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf('shiftcal-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
// 캐시 저장이 끝나기 전에 워커가 멈추지 않게 ev.waitUntil 로 붙잡는다
function put(req, res, ev) {
  if (res && (res.ok || res.type === 'opaque')) {
    var copy = res.clone(), p = caches.open(CACHE).then(function (c) { return c.put(req, copy); }).catch(function () {});
    if (ev) ev.waitUntil(p);
  }
  return res;
}
self.addEventListener('push', function (e) {
  var m = {}; try { m = e.data ? e.data.json() : {}; } catch (x) {}
  if (!m || typeof m !== 'object') m = {};   // 본문이 null·글자·숫자여도 알림은 반드시 띄운다 (안 띄우면 아이폰이 구독을 취소함)
  var urgent = Number(m.prio) >= 5;
  e.waitUntil(self.registration.showNotification(m.title || '설비 알림', { body: m.text || '', tag: m.id || undefined, icon: 'icon-192.png', badge: 'badge-96.png',
    requireInteraction: urgent, renotify: !!m.id && urgent, vibrate: urgent ? [500, 200, 500, 200, 500, 200, 800] : [200], data: { id: m.id } }).then(function () {
    return self.clients.matchAll({ type: 'window' }).then(function (l) { l.forEach(function (c) { c.postMessage('new'); }); });
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (l) {
    for (var i = 0; i < l.length; i++) if ('focus' in l[i]) return l[i].focus();
    return self.clients.openWindow('./');
  }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  var same = url.origin === self.location.origin;
  if (same && /\.(ics|apk)$/i.test(url.pathname)) return;
  if (!same && !/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return;
  if (req.mode === 'navigate') {
    // 연 페이지는 그 주소로 저장 (전에는 모든 페이지를 './' 로 저장해서, 알람 안내를 보고 나면 오프라인 첫 화면이 안내 페이지가 됐음)
    // 느린 현장 네트워크에서 오래 멈추지 않게 2.5초 넘으면 캐시로 먼저 응답한다
    var netNav = fetch(req).then(function (res) { return put(req, res, e); });
    e.waitUntil(netNav.catch(function () {}));   // 2.5초 뒤에 온 응답도 캐시에 저장되게
    e.respondWith(Promise.race([
      netNav,
      new Promise(function (resolve, reject) { setTimeout(function () { reject(new Error('timeout')); }, 2500); })
    ]).catch(function () {
      netNav.catch(function () {});
      // 저장해 둔 같은 페이지 → (없으면) 네트워크 응답을 계속 기다림 → 그래도 안 되면 홈 화면
      return caches.match(req, { ignoreSearch: true }).then(function (r) {
        return r || netNav.catch(function () { return null; });
      }).then(function (r) { return r || caches.match('./'); });
    }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) {
    var net = fetch(req).then(function (res) { return put(req, res, e); });
    if (hit) { net.catch(function () {}); return hit; }
    return net;
  }));
});
