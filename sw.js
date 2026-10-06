const C='milim-v4';const F=['./','index.html','manifest.json','icon-192.png','icon-512.png','photos.txt'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>{const n=fetch(e.request).then(res=>{if(res.ok)caches.open(C).then(c=>c.put(e.request,res.clone()));return res}).catch(()=>r);return r||n}))});
