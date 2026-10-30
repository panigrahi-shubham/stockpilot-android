import { Redirect } from 'expo-router';
import { useApp } from '@/state/AppContext';

export default function Index() {
  const { state } = useApp();
  if (!state.onboarded) return <Redirect href="/onboarding" />;
  if (!state.user) return <Redirect href="/login" />;
  return <Redirect href="/home" />;
}
