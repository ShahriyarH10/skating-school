const CACHE='oss-static-v3';
const APP_SHELL=['/','/login','/manifest.json','/icon-192.png','/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP_SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const req=event.request;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
  if(req.method!=='GET')return;

  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy));return r;}).catch(()=>caches.match(req).then(r=>r||caches.match('/'))));
    return;
  }

  // Build output under /_next/ gets a new hash on every deploy but Next dev
  // can reuse the same chunk URL across recompiles — cache-first here means
  // the tab keeps running whatever JS it first cached, forever, no matter
  // what the server now sends. Always prefer the network for these; the
  // cache is only a fallback for offline use.
  if(url.pathname.startsWith('/_next/')){
    event.respondWith(fetch(req).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy));return r;}).catch(()=>caches.match(req)));
    return;
  }

  // Everything else (icons, manifest) barely changes — cache-first is fine.
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy));return r;})));
});
