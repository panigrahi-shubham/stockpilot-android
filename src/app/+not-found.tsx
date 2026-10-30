import React from 'react';
import { useRouter } from 'expo-router';
import { AppHeader, Screen } from '@/components/chrome';
import { EmptyState } from '@/components/ui';

export default function NotFound() {
  const router = useRouter();
  return (
    <Screen testID="not-found-screen">
      <AppHeader testID="not-found-header" title="Page not found" showCart={false} />
      <EmptyState
        testID="not-found"
        icon="compass-outline"
        title="We couldn’t find that page"
        subtitle="The link may be broken or the page may have moved."
        action="Go to home"
        onAction={() => router.replace('/')}
      />
    </Screen>
  );
}
