import { useState, useEffect, useCallback } from 'react';

export interface RecentEditItem {
  id: string;
  name: string;
  timestamp: number;
}

const EXPIRY_MS = 24 * 60 * 60 * 1000; // 1 day

export function useRecentEdits(type: 'packages' | 'itineraries') {
  const storageKey = `letslive_recent_edits_${type}`;
  const [items, setItems] = useState<RecentEditItem[]>([]);

  // Load and clean up expired items
  const loadItems = useCallback(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return [];
      
      const parsed: RecentEditItem[] = JSON.parse(stored);
      const now = Date.now();
      
      // Filter out expired items
      const validItems = parsed.filter(item => now - item.timestamp < EXPIRY_MS);
      
      // If we filtered out expired items, save the clean list back
      if (validItems.length !== parsed.length) {
        localStorage.setItem(storageKey, JSON.stringify(validItems));
      }
      
      return validItems;
    } catch (err) {
      console.error('Failed to parse recent edits from localStorage', err);
      return [];
    }
  }, [storageKey]);

  useEffect(() => {
    setItems(loadItems());
  }, [loadItems]);

  const addEditItem = useCallback((id: string, name: string) => {
    if (typeof window === 'undefined' || !name.trim()) return;
    
    setItems(prev => {
      const now = Date.now();
      // Remove if it already exists to move it to the front
      const filtered = prev.filter(item => item.id !== id);
      const newItems = [{ id, name, timestamp: now }, ...filtered].slice(0, 10); // keep max 10
      
      localStorage.setItem(storageKey, JSON.stringify(newItems));
      return newItems;
    });
  }, [storageKey]);

  const removeEditItem = useCallback((id: string) => {
    setItems(prev => {
      const newItems = prev.filter(item => item.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(newItems));
      return newItems;
    });
  }, [storageKey]);

  return { items, addEditItem, removeEditItem };
}
