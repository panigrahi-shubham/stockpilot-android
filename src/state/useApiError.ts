import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ApiError, errorMessage } from '@/data/api';
import { useToast } from '@/components/overlays';
import { useApp } from './AppContext';

/** Central error handling: session expiry → native alert + back to login; everything else → toast. */
export function useApiError() {
  const toast = useToast();
  const router = useRouter();
  const { actions } = useApp();
  return useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && e.code === 'SESSION_EXPIRED') {
        Alert.alert('Session expired', 'For your security you have been signed out. Please sign in again.', [
          {
            text: 'Sign in',
            onPress: () => {
              actions.signOut('expired');
              router.replace('/login');
            },
          },
        ], { cancelable: false });
        return;
      }
      toast.show(errorMessage(e), 'error');
    },
    [toast, router, actions],
  );
}
