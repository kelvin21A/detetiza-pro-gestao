import { useEffect, useCallback } from 'react';
import { ServiceCall, ServiceCallStatus } from './useServiceCalls';

const CACHE_KEY_PREFIX = 'service_calls_cache';
const CACHE_VERSION = 'v1';
const CACHE_EXPIRY_DAYS = 7; // Cache data for 7 days

interface CachedData<T> {
  data: T;
  timestamp: number;
  version: string;
}

export function useServiceCallCache() {
  // Get the cache key for a specific organization
  const getCacheKey = useCallback((organizationId: string, key: string) => {
    return `${CACHE_KEY_PREFIX}_${organizationId}_${key}`;
  }, []);

  // Save data to cache
  const saveToCache = useCallback(async <T>(
    organizationId: string, 
    key: string, 
    data: T
  ): Promise<void> => {
    if (!('caches' in window)) return;

    const cacheKey = getCacheKey(organizationId, key);
    const cacheData: CachedData<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION
    };

    try {
      const cache = await caches.open('service-calls');
      const response = new Response(JSON.stringify(cacheData), {
        headers: { 'Content-Type': 'application/json' }
      });
      await cache.put(cacheKey, response);
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }, [getCacheKey]);

  // Get data from cache
  const getFromCache = useCallback(async <T>(
    organizationId: string, 
    key: string
  ): Promise<T | null> => {
    if (!('caches' in window)) return null;

    const cacheKey = getCacheKey(organizationId, key);
    
    try {
      const cache = await caches.open('service-calls');
      const response = await cache.match(cacheKey);
      
      if (!response) return null;
      
      const cachedData: CachedData<T> = await response.json();
      
      // Check if cache is expired
      const cacheAge = Date.now() - cachedData.timestamp;
      const cacheExpiry = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // Convert days to ms
      
      if (cacheAge > cacheExpiry || cachedData.version !== CACHE_VERSION) {
        await cache.delete(cacheKey);
        return null;
      }
      
      return cachedData.data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }, [getCacheKey]);

  // Clear expired cache entries
  const cleanupExpiredCache = useCallback(async (): Promise<void> => {
    if (!('caches' in window)) return;

    try {
      const cache = await caches.open('service-calls');
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (!response) continue;
        
        try {
          const cachedData: CachedData<unknown> = await response.json();
          const cacheAge = Date.now() - cachedData.timestamp;
          const cacheExpiry = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
          
          if (cacheAge > cacheExpiry || cachedData.version !== CACHE_VERSION) {
            await cache.delete(request);
          }
        } catch (error) {
          console.error('Error processing cache entry:', error);
          await cache.delete(request);
        }
      }
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  }, []);

  // Initialize cache cleanup on component mount
  useEffect(() => {
    cleanupExpiredCache();
    
    // Clean up cache periodically (once per day)
    const interval = setInterval(cleanupExpiredCache, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [cleanupExpiredCache]);

  return {
    saveToCache,
    getFromCache,
    cleanupExpiredCache
  };
}

// Cache service worker registration
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');
      })
      .catch(error => {
        console.error('ServiceWorker registration failed: ', error);
      });
  });
}
