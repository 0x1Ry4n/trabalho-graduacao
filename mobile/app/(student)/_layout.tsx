import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { CustomDrawerContent } from '../../src/components/navigation/DrawerContent';
import { useAuthStore } from '../../src/store/auth.store';
import { UserRole } from '../../src/types';

const DRAWER_CONFIG = {
  accentColor: '#7C3AED',
  accentScheme: 'student',
  roleLabel: 'Estudante',
  roleIcon: 'school-outline',
  items: [
    { name: 'index', label: 'Meu Passe', icon: 'qr-code-outline' },
    { name: 'payments', label: 'Pagamentos', icon: 'receipt-outline' },
    { name: 'routes', label: 'Rotas', icon: 'navigate-outline' },
    { name: 'calendar', label: 'Calendário', icon: 'calendar-outline' },
    { name: 'profile', label: 'Meu Perfil', icon: 'person-circle-outline' },
  ],
};

export default function StudentLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || user?.role !== UserRole.STUDENT) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Drawer
      drawerContent={(props) => (
        <CustomDrawerContent {...props} config={DRAWER_CONFIG} />
      )}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { width: 280 },
        swipeEnabled: true,
      }}
    >
      <Drawer.Screen name="index" options={{ title: 'Passe' }} />
      <Drawer.Screen name="routes" options={{ title: 'Rotas' }} />
      <Drawer.Screen name="calendar" options={{ title: 'Calendario' }} />
      <Drawer.Screen name="payments" options={{ title: 'Pagamentos' }} />
      <Drawer.Screen name="profile" options={{ title: 'Perfil' }} />
    </Drawer>
  );
}
