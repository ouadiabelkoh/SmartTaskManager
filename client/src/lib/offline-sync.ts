import { sendMessage, isConnected } from "./websocket";

// Queue to store operations while offline
type SyncOperation = {
  id: string;
  type: string;
  endpoint: string;
  method: string;
  data: any;
  timestamp: number;
};

const STORAGE_KEY = 'pos_offline_queue';

// Initialize IndexedDB
let db: IDBDatabase | null = null;

export async function initOfflineSync(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('posOfflineDB', 1);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      // Create stores for offline data
      if (!database.objectStoreNames.contains('syncQueue')) {
        database.createObjectStore('syncQueue', { keyPath: 'id' });
      }
      
      if (!database.objectStoreNames.contains('products')) {
        database.createObjectStore('products', { keyPath: 'id' });
      }
      
      if (!database.objectStoreNames.contains('categories')) {
        database.createObjectStore('categories', { keyPath: 'id' });
      }
      
      if (!database.objectStoreNames.contains('customers')) {
        database.createObjectStore('customers', { keyPath: 'id' });
      }
      
      if (!database.objectStoreNames.contains('sales')) {
        database.createObjectStore('sales', { keyPath: 'id' });
      }
      
      if (!database.objectStoreNames.contains('inventory')) {
        database.createObjectStore('inventory', { keyPath: 'id' });
      }
    };
  });
}

export async function queueOperation(
  type: string,
  endpoint: string, 
  method: string, 
  data: any
): Promise<string> {
  if (!db) {
    await initOfflineSync();
  }
  
  const operation: SyncOperation = {
    id: crypto.randomUUID(),
    type,
    endpoint,
    method,
    data,
    timestamp: Date.now()
  };
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    const request = store.add(operation);
    
    request.onsuccess = () => resolve(operation.id);
    request.onerror = () => reject(new Error('Failed to queue operation'));
  });
}

export async function syncQueuedOperations(): Promise<boolean> {
  if (!isConnected()) {
    return false;
  }
  
  if (!db) {
    await initOfflineSync();
  }
  
  return new Promise((resolve) => {
    const transaction = db!.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const request = store.getAll();
    
    request.onsuccess = async () => {
      const operations = request.result as SyncOperation[];
      
      if (operations.length === 0) {
        resolve(true);
        return;
      }
      
      // Sort by timestamp to maintain order
      operations.sort((a, b) => a.timestamp - b.timestamp);
      
      let syncSuccess = true;
      
      for (const operation of operations) {
        try {
          // Try to sync with server
          const result = sendMessage('sync_operation', {
            id: operation.id,
            type: operation.type,
            endpoint: operation.endpoint,
            method: operation.method,
            data: operation.data
          });
          
          if (result) {
            // Remove from queue if successfully sent
            await removeFromQueue(operation.id);
          } else {
            syncSuccess = false;
            break;
          }
        } catch (error) {
          console.error('Error syncing operation:', error);
          syncSuccess = false;
          break;
        }
      }
      
      resolve(syncSuccess);
    };
    
    request.onerror = () => {
      console.error('Error retrieving queued operations');
      resolve(false);
    };
  });
}

export async function getQueuedOperationsCount(): Promise<number> {
  if (!db) {
    await initOfflineSync();
  }
  
  return new Promise((resolve) => {
    const transaction = db!.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const countRequest = store.count();
    
    countRequest.onsuccess = () => resolve(countRequest.result);
    countRequest.onerror = () => resolve(0);
  });
}

async function removeFromQueue(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to remove operation from queue'));
  });
}

// Store and retrieve offline data
export async function storeOfflineData<T>(
  storeName: string, 
  data: T & { id: string | number }
): Promise<void> {
  if (!db) {
    await initOfflineSync();
  }
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to store data in ${storeName}`));
  });
}

export async function getOfflineData<T>(
  storeName: string, 
  id: string | number
): Promise<T | null> {
  if (!db) {
    await initOfflineSync();
  }
  
  return new Promise((resolve) => {
    const transaction = db!.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });
}

export async function getAllOfflineData<T>(storeName: string): Promise<T[]> {
  if (!db) {
    await initOfflineSync();
  }
  
  return new Promise((resolve) => {
    const transaction = db!.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
}

export async function deleteOfflineData(
  storeName: string, 
  id: string | number
): Promise<void> {
  if (!db) {
    await initOfflineSync();
  }
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to delete data from ${storeName}`));
  });
}

export function isOnline(): boolean {
  return navigator.onLine && isConnected();
}

// Initialize listeners for online/offline events
export function initOnlineListeners(
  onOnline: () => void, 
  onOffline: () => void
): void {
  window.addEventListener('online', () => {
    if (isConnected()) {
      onOnline();
      syncQueuedOperations();
    }
  });
  
  window.addEventListener('offline', onOffline);
}
