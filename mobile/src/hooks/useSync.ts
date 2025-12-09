import { useEffect, useRef } from 'react';
import { useNetwork } from './useNetwork';
import { useSyncStore } from '../store/sync.store';

export function useSync() {
  const { isConnected } = useNetwork();
  const { syncAll, loadPending, pendingValidations, isSyncing, lastSyncAt } =
    useSyncStore();
  const wasOfflineRef = useRef(!isConnected);

  // Load pending validations from DB on mount
  useEffect(() => {
    loadPending();
  }, [loadPending]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isConnected && wasOfflineRef.current) {
      syncAll();
    }
    wasOfflineRef.current = !isConnected;
  }, [isConnected, syncAll]);

  const pendingCount = pendingValidations.filter((v) => !v.synced).length;

  return {
    isConnected,
    pendingCount,
    isSyncing,
    lastSyncAt,
    syncAll,
  };
}
