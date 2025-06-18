import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;

// Clean up old caches
cleanupOutdatedCaches();

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);

// Take control of all clients immediately
self.skipWaiting();
clientsClaim();

// Cache API responses with stale-while-revalidate strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      {
        cacheKeyWillBeUsed: async ({ request }) => {
          return `${request.url}?timestamp=${Date.now()}`;
        },
      },
    ],
  })
);

// Cache images with cache-first strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null;
        },
      },
    ],
  })
);

// Cache fonts with cache-first strategy
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || 
              url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'fonts-cache',
  })
);

// Handle background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  try {
    // Get offline data from IndexedDB
    const offlineData = await getOfflineData();
    
    if (offlineData && offlineData.length > 0) {
      // Sync each offline item
      for (const item of offlineData) {
        try {
          await syncItem(item);
          await removeOfflineItem(item.id);
        } catch (error) {
          console.error('Failed to sync item:', error);
        }
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function getOfflineData(): Promise<any[]> {
  // This would integrate with your IndexedDB storage
  return [];
}

async function syncItem(item: any): Promise<void> {
  // Implement actual sync logic here
  console.log('Syncing item:', item);
}

async function removeOfflineItem(id: string): Promise<void> {
  // Remove synced item from offline storage
  console.log('Removing offline item:', id);
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        data: data.url,
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data) {
    event.waitUntil(
      self.clients.openWindow(event.notification.data)
    );
  }
});