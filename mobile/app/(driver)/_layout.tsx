import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { CustomDrawerContent } from '../../src/components/navigation/DrawerContent';
import { useAuthStore } from '../../src/store/auth.store';
import { UserRole } from '../../src/types';

const DRAWER_CONFIG = {
  accentColor: '#059669',
  accentScheme: 'driver',
  roleLabel: 'Motorista',
  roleIcon: 'bus-outline',
  items: [
    { name: 'index', label: 'Validar Cartão', icon: 'scan-outline' },
    { name: 'history', label: 'Histórico', icon: 'journal-outline' },
    { name: 'routes/index', label: 'Minhas Rotas', icon: 'navigate-outline' },
    { name: 'profile', label: 'Meu Perfil', icon: 'person-circle-outline' },
  ],
};

export default function DriverLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || user?.role !== UserRole.DRIVER) {
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
      <Drawer.Screen name="index" options={{ title: 'Validar' }} />
      <Drawer.Screen name="routes/index" options={{ title: 'Minhas Rotas' }} />
      <Drawer.Screen name="history" options={{ title: 'Histórico' }} />
      <Drawer.Screen name="profile" options={{ title: 'Meu Perfil' }} />
      <Drawer.Screen
        name="routes/[id]"
        options={{
          drawerItemStyle: { display: 'none' },
          title: 'Detalhes da Rota',
        }}
      />
    </Drawer>
  );
}
