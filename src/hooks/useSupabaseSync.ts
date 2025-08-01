import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { usePWA } from './usePWA';

interface SyncState {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
  syncError: string | null;
}

interface SupabaseSyncHook extends SyncState {
  syncData: () => Promise<void>;
  addPendingChange: (change: any) => void;
  clearPendingChanges: () => void;
  isOnline: boolean;
}

// IndexedDB helper for offline storage
class OfflineStorage {
  private dbName = 'detetizapro-offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create stores for different data types
        if (!db.objectStoreNames.contains('clients')) {
          db.createObjectStore('clients', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('service_calls')) {
          db.createObjectStore('service_calls', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('pending_changes')) {
          const store = db.createObjectStore('pending_changes', { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('type', 'type');
        }
      };
    });
  }

  async addPendingChange(change: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pending_changes'], 'readwrite');
      const store = transaction.objectStore('pending_changes');
      
      const changeWithTimestamp = {
        ...change,
        timestamp: new Date().toISOString(),
        id: Date.now() + Math.random(), // Simple ID generation
      };
      
      const request = store.add(changeWithTimestamp);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingChanges(): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pending_changes'], 'readonly');
      const store = transaction.objectStore('pending_changes');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearPendingChanges(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pending_changes'], 'readwrite');
      const store = transaction.objectStore('pending_changes');
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async cacheData(storeName: string, data: any[]): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore('store');
      
      // Clear existing data
      store.clear();
      
      // Add new data
      data.forEach(item => {
        store.add(item);
      });
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getCachedData(storeName: string): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

const offlineStorage = new OfflineStorage();

export const useSupabaseSync = (): SupabaseSyncHook => {
  const { isOnline } = usePWA();
  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    lastSyncTime: null,
    pendingChanges: 0,
    syncError: null,
  });

  // Initialize offline storage
  useEffect(() => {
    offlineStorage.init().catch(console.error);
  }, []);

  // Load pending changes count on mount
  useEffect(() => {
    const loadPendingChanges = async () => {
      try {
        const changes = await offlineStorage.getPendingChanges();
        setState(prev => ({ ...prev, pendingChanges: changes.length }));
      } catch (error) {
        console.error('Error loading pending changes:', error);
      }
    };

    loadPendingChanges();
  }, []);

  // Sync data with Supabase
  const syncData = useCallback(async () => {
    if (!isOnline) {
      console.log('Cannot sync: offline');
      return;
    }

    setState(prev => ({ ...prev, isSyncing: true, syncError: null }));

    try {
      // Get pending changes
      const pendingChanges = await offlineStorage.getPendingChanges();
      
      // Process each pending change
      for (const change of pendingChanges) {
        await processPendingChange(change);
      }

      // Clear pending changes after successful sync
      if (pendingChanges.length > 0) {
        await offlineStorage.clearPendingChanges();
      }

      // Update last sync time
      const lastSyncTime = new Date();
      localStorage.setItem('last-sync-time', lastSyncTime.toISOString());

      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime,
        pendingChanges: 0,
        syncError: null,
      }));

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync error:', error);
      setState(prev => ({
        ...prev,
        isSyncing: false,
        syncError: error instanceof Error ? error.message : 'Sync failed',
      }));
    }
  }, [isOnline]);

  // Process individual pending change
  const processPendingChange = async (change: any) => {
    const { type, table, action, data } = change;

    try {
      switch (action) {
        case 'insert':
          await supabase.from(table).insert(data);
          break;
        case 'update':
          await supabase.from(table).update(data).eq('id', data.id);
          break;
        case 'delete':
          await supabase.from(table).delete().eq('id', data.id);
          break;
        default:
          console.warn('Unknown action:', action);
      }
    } catch (error) {
      console.error(`Error processing ${action} on ${table}:`, error);
      throw error;
    }
  };

  // Add pending change for offline sync
  const addPendingChange = useCallback(async (change: any) => {
    try {
      await offlineStorage.addPendingChange(change);
      setState(prev => ({ ...prev, pendingChanges: prev.pendingChanges + 1 }));
      
      // If online, try to sync immediately
      if (isOnline) {
        setTimeout(() => syncData(), 100);
      }
    } catch (error) {
      console.error('Error adding pending change:', error);
    }
  }, [isOnline, syncData]);

  // Clear pending changes
  const clearPendingChanges = useCallback(async () => {
    try {
      await offlineStorage.clearPendingChanges();
      setState(prev => ({ ...prev, pendingChanges: 0 }));
    } catch (error) {
      console.error('Error clearing pending changes:', error);
    }
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && state.pendingChanges > 0) {
      console.log('Back online, syncing pending changes...');
      syncData();
    }
  }, [isOnline, state.pendingChanges, syncData]);

  // Load last sync time from localStorage
  useEffect(() => {
    const lastSyncTimeStr = localStorage.getItem('last-sync-time');
    if (lastSyncTimeStr) {
      setState(prev => ({
        ...prev,
        lastSyncTime: new Date(lastSyncTimeStr),
      }));
    }
  }, []);

  return {
    ...state,
    syncData,
    addPendingChange,
    clearPendingChanges,
    isOnline,
  };
};

// Utility functions for offline/online data management
export const SupabaseSyncUtils = {
  // Create a change record for offline sync
  createChange: (table: string, action: 'insert' | 'update' | 'delete', data: any) => ({
    table,
    action,
    data,
    timestamp: new Date().toISOString(),
  }),

  // Check if data is from cache
  isFromCache: (response: any): boolean => {
    return response?.headers?.['X-From-Cache'] === 'true';
  },

  // Format sync status for display
  formatSyncStatus: (lastSyncTime: Date | null, pendingChanges: number): string => {
    if (pendingChanges > 0) {
      return `${pendingChanges} alterações pendentes`;
    }
    
    if (!lastSyncTime) {
      return 'Nunca sincronizado';
    }
    
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSyncTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) {
      return 'Sincronizado agora';
    } else if (diffMinutes < 60) {
      return `Sincronizado há ${diffMinutes} min`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return `Sincronizado há ${diffHours}h`;
    }
  },
};
