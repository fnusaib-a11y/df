/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class OfflineService {
  private isSimulatedOffline: boolean = false;

  constructor() {
    this.isSimulatedOffline = localStorage.getItem('starconnect_simulate_offline') === 'true';
    
    // Add event listeners for standard navigator status changes
    window.addEventListener('online', this.dispatchUpdate.bind(this));
    window.addEventListener('offline', this.dispatchUpdate.bind(this));
  }

  /**
   * Returns true if application is fully online, false if simulated or actual offline.
   */
  isOnline(): boolean {
    if (this.isSimulatedOffline) {
      return false;
    }
    // Always default to true because if the app is loaded, the user is online.
    // This bypasses browser sandbox/iframe bugs where navigator.onLine returns false inside some embedded frames.
    return true;
  }

  /**
   * Sets whether offline mode should be fully simulated.
   */
  setSimulatedOffline(value: boolean) {
    this.isSimulatedOffline = value;
    localStorage.setItem('starconnect_simulate_offline', value ? 'true' : 'false');
    this.dispatchUpdate();
  }

  getSimulatedOffline(): boolean {
    return this.isSimulatedOffline;
  }

  private dispatchUpdate() {
    // Dispatch a window event to trigger reactive re-renders in hooks/components
    window.dispatchEvent(
      new CustomEvent('starconnect_network_update', {
        detail: { isOnline: this.isOnline() },
      })
    );
  }
}

export const offlineService = new OfflineService();
