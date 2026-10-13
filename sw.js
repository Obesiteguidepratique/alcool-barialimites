// Alcool Barialimites — Service Worker
// RC7 Build 686 · 21/09/2026
const CACHE_NAME = 'barialimites-v686';
const ASSETS = ['./index.html','./cocktails.js','./plats.js','./verres.js','./boissons-data.js','./dashboard.js','./journal.js','./alarmes.js','./News.json','./manifest.json','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
let _swTimers = [];
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SET_ALARMS') { _swTimers.forEach(clearTimeout); _swTimers = []; (event.data.alarmes || []).forEach(function(a) { _swTimers.push(setTimeout(function() { self.registration.showNotification(a.titre, { body: a.corps, icon: './icons/icon-192.png', badge: './icons/icon-192.png', requireInteraction: true, vibrate: [400, 150, 400] }); }, a.delaiMs)); }); }
  if (event.data && event.data.type === 'CLEAR_ALARMS') { _swTimers.forEach(clearTimeout); _swTimers = []; }
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isNetFirst = url.pathname.endsWith('.html') || url.pathname.endsWith('/') || url.pathname.endsWith('News.json');
  if (isNetFirst) { event.respondWith(fetch(event.request).then(response => { if (response && response.status === 200) { const clone = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)); } return response; }).catch(() => caches.match(event.request))); }
  else { event.respondWith(caches.match(event.request).then(cached => { if (cached) return cached; return fetch(event.request).then(response => { if (response && response.status === 200) { const clone = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)); } return response; }).catch(() => caches.match('./index.html')); })); }
});
