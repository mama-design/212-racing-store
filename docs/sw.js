const CACHE='212-github-shell-v1';
const root=new URL('./',self.registration.scope).href;
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==self.location.origin||!u.href.startsWith(root)||e.request.method!=='GET')return;
if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(async r=>{if(r.ok&&r.headers.get('content-type')?.includes('text/html')){const c=await caches.open(CACHE);await c.put(root,r.clone())}return r}).catch(async()=>await caches.match(root)||new Response('Conecte à internet e abra o app uma vez antes de usar offline.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}})));return;}
if(/\.(js|css|svg|woff2?)(\?|$)/.test(u.pathname))e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(async r=>{if(r.ok){const cache=await caches.open(CACHE);await cache.put(e.request,r.clone())}return r})));});
self.addEventListener('message',e=>{if(e.data?.type==='PREPARE')e.waitUntil((async()=>{try{const cache=await caches.open(CACHE);const urls=[root,new URL('logo.svg',root).href,...new Set(e.data.urls||[])];await Promise.all(urls.map(async url=>{const u=new URL(url,self.location.origin);if(u.origin!==self.location.origin||!u.href.startsWith(root))return;const r=await fetch(u.href);if(!r.ok)throw Error('cache');await cache.put(u.href,r)}));e.source?.postMessage({type:'READY'});}catch{}})());});
