import { useEffect, useRef } from 'react';
import { useNetworkState } from 'expo-network';
import { runtime, useApp } from './AppContext';
import { useToast } from '@/components/overlays';

/**
 * Real device connectivity (expo-network) merged with QA Lab's "Simulate offline".
 * Turn on airplane mode / toggle Wi-Fi from your test (driver.toggleAirplaneMode()) and the app reacts.
 */
export function useOnline() {
  const net = useNetworkState();
  const { state } = useApp();
  const realOffline = net.isConnected === false || net.isInternetReachable === false;
  return { online: !realOffline && !state.qa.offline, realOffline, simulatedOffline: state.qa.offline, type: net.type };
}

/** Keeps the mock API aware of real connectivity and announces changes with a toast. */
export function NetworkWatcher() {
  const { realOffline } = useOnline();
  const toast = useToast();
  const first = useRef(true);
  useEffect(() => {
    runtime.netOnline = !realOffline;
    if (first.current) {
      first.current = false;
      return;
    }
    toast.show(realOffline ? 'You are offline. Check Wi-Fi or mobile data.' : 'Back online', realOffline ? 'error' : 'success');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realOffline]);
  return null;
}
