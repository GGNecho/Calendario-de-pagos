// Para que la app abra sin señal: guarda una copia de las páginas, estilos y scripts
// propios. Siempre intenta primero la versión nueva de internet y solo si no hay red
// usa la copia (así un cambio publicado se ve en cuanto hay señal). Los datos sin
// señal los maneja Firestore aparte (ver conectar() en comun.js).
const CACHE = 'calendario-v5';
const ARCHIVOS = ['./', 'tablero.html', 'index.html', 'historial.html', 'documentos.html',
  'estilo.css', 'fechas.js', 'comun.js', 'acceso.js', 'manifest.webmanifest', 'icons/icono-192.png', 'icons/icono-512.png'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=> c.addAll(ARCHIVOS)).then(()=> self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=> Promise.all(ks.filter(k=> k !== CACHE).map(k=> caches.delete(k)))).then(()=> self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);
  if(e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(r=>{
      if(r.ok){ const copia = r.clone(); caches.open(CACHE).then(c=> c.put(e.request, copia)); }
      return r;
    }).catch(()=> caches.match(e.request, {ignoreSearch:true}))
  );
});

// Avisos (los manda scripts/avisos.mjs por Firebase Cloud Messaging como datos).
self.addEventListener('push', e=>{
  let p = {};
  try{ p = e.data ? e.data.json() : {}; }catch(_){ p = {data:{body: e.data && e.data.text()}}; }
  const d = p.data || (p.notification) || {};
  e.waitUntil(self.registration.showNotification(d.title || 'Pagos', {
    body: d.body || '', icon: 'icons/icono-192.png', badge: 'icons/icono-192.png', tag: 'avisos-del-dia',
    data: {link: d.link || 'tablero.html'},
  }));
});
self.addEventListener('notificationclick', e=>{
  e.notification.close();
  const link = (e.notification.data && e.notification.data.link) || 'tablero.html';
  e.waitUntil(self.clients.matchAll({type:'window', includeUncontrolled:true}).then(ws=>{
    const w = ws.find(x=> x.url.includes('tablero.html'));
    return w ? w.focus() : self.clients.openWindow(link);
  }));
});
