/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { offlineService } from '../services/offline';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(offlineService.isOnline());

  useEffect(() => {
    const handleNetworkUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ isOnline: boolean }>;
      setIsOnline(customEvent.detail?.isOnline ?? offlineService.isOnline());
    };

    // Listen to simulated or actual state updates
    window.addEventListener('starconnect_network_update', handleNetworkUpdate);
    window.addEventListener('online', handleNetworkUpdate);
    window.addEventListener('offline', handleNetworkUpdate);

    // Initial check
    setIsOnline(offlineService.isOnline());

    return () => {
      window.removeEventListener('starconnect_network_update', handleNetworkUpdate);
      window.removeEventListener('online', handleNetworkUpdate);
      window.removeEventListener('offline', handleNetworkUpdate);
    };
  }, []);

  return isOnline;
}
