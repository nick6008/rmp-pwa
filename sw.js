const CACHE_NAME = 'postgo-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './services.html',
  './tracking.html',
  './order.html',
  './auth.html',
  './account.html',
  './styles.css',
  './script.js',
  './icons8-коробка-64.png',
  './manifest.webmanifest'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Установка...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Кеширование файлов...');
        return cache.addAll(ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Установка завершена');
        return self.skipWaiting();
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Активация...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Удаление старого кеша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Активация завершена');
      return self.clients.claim();
    })
  );
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Стратегия кеширования: Cache First
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Если есть в кеше, возвращаем кешированную версию
        if (cachedResponse) {
          console.log('Service Worker: Загружено из кеша:', request.url);
          return cachedResponse;
        }
        
        // Если нет в кеше, загружаем из сети
        console.log('Service Worker: Загрузка из сети:', request.url);
        return fetch(request)
          .then((response) => {
            // Проверяем, что ответ валидный
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Клонируем ответ для кеширования
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // Если нет сети, показываем офлайн-страницу
            if (request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
  console.log('Service Worker: Получено push-уведомление');
  
  let notificationData = {
    title: 'POST GO',
    body: 'Новое уведомление от POST GO',
    icon: './icons8-коробка-64.png',
    badge: './icons8-коробка-64.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Открыть приложение',
        icon: './icons8-коробка-64.png'
      },
      {
        action: 'close',
        title: 'Закрыть',
        icon: './icons8-коробка-64.png'
      }
    ]
  };

  // Если есть данные в push-событии, используем их
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        title: pushData.title || notificationData.title,
        body: pushData.body || notificationData.body,
        icon: pushData.icon || notificationData.icon,
        data: {
          ...notificationData.data,
          ...pushData.data
        }
      };
    } catch (e) {
      // Если не удалось распарсить JSON, используем текст
      notificationData.body = event.data.text() || notificationData.body;
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Клик по уведомлению');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('./')
    );
  } else if (event.action === 'close') {
    // Просто закрываем уведомление
    return;
  } else {
    // Клик по самому уведомлению (не по кнопке)
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});

// Обработка закрытия уведомлений
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Уведомление закрыто');
});

