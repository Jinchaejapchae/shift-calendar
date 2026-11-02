var CACHE = 'shiftcal-6f331fa4f3';
var CORE = ["./","index.html","iphone-alarm.html","manifest.webmanifest","icon.svg","icon-180.png","icon-192.png","icon-512.png"];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf('shiftcal-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function put(req, res) { if (res && (res.ok || res.type === 'opaque')) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); } return res; }
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  var same = url.origin === self.location.origin;
  if (same && /\.(ics|apk)$/i.test(url.pathname)) return;
  if (!same && !/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (res) { return put('./', res); }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (r) { return r || caches.match('./'); });
    }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) {
    var net = fetch(req).then(function (res) { return put(req, res); });
    if (hit) { net.catch(function () {}); return hit; }
    return net;
  }));
});
