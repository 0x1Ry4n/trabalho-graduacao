import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../src/store/auth.store';
import { UserRole } from '../src/types';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E40AF' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role === UserRole.ADMIN) return <Redirect href="/(admin)" />;
  if (user?.role === UserRole.DRIVER) return <Redirect href="/(driver)" />;
  if (user?.role === UserRole.STUDENT) return <Redirect href="/(student)" />;

  return <Redirect href="/(auth)/login" />;
}
