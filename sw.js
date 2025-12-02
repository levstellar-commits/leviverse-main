// 注意：我把版本号改成了 v2，这样浏览器会知道要更新了
const CACHE_NAME = 'levythos-cache-v2';
const OFFLINE_URL = './offline.html';

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  OFFLINE_URL // 把断网页面也缓存起来
];

// 1. 安装：把断网页面提前存好
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  // 强制立即接管，不用等待下次打开
  self.skipWaiting();
});

// 2. 拦截请求：断网时自动切换
self.addEventListener('fetch', event => {
  // 如果是页面导航请求（比如点链接、刷新页面）
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // 如果网络请求失败（断网了），就返回缓存里的 offline.html
          return caches.match(OFFLINE_URL);
        })
    );
  } else {
    // 如果是图片、CSS等其他资源，还是照旧：先找缓存，没有就去网络，网络也没有就算了
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});

// 3. 清理旧缓存
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 立即激活，让所有页面生效
  return self.clients.claim();
});