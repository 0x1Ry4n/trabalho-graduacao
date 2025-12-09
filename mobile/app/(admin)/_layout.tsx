import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { CustomDrawerContent } from '../../src/components/navigation/DrawerContent';
import { useAuthStore } from '../../src/store/auth.store';
import { UserRole } from '../../src/types';

const DRAWER_CONFIG = {
  accentColor: '#1E40AF',
  accentScheme: 'admin',
  roleLabel: 'Administrador',
  roleIcon: 'shield-checkmark-outline',
  items: [
    { name: 'index', label: 'Painel', icon: 'grid-outline' },
    { name: 'users', label: 'Usuários', icon: 'people-outline' },
    { name: 'colleges', label: 'Instituições', icon: 'school-outline' },
    { name: 'students', label: 'Alunos', icon: 'people-outline' },
    { name: 'enrollments', label: 'Matrículas', icon: 'school-outline' },
    { name: 'drivers', label: 'Motoristas', icon: 'car-sport-outline' },
    { name: 'vehicles', label: 'Veiculos', icon: 'bus-outline' },
    { name: 'routes', label: 'Rotas', icon: 'navigate-outline' },
    { name: 'stops', label: 'Paradas', icon: 'pin-outline' },
    { name: 'payments', label: 'Cobranças', icon: 'cash-outline' },
    { name: 'audit-logs', label: 'Auditoria', icon: 'document-text-outline' },
    { name: 'profile', label: 'Meu Perfil', icon: 'person-circle-outline' },
  ],
};

export default function AdminLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || user?.role !== UserRole.ADMIN) {
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
      <Drawer.Screen name="index" options={{ title: 'Painel' }} />
      <Drawer.Screen name="users" options={{ title: 'Usuários' }} />
      <Drawer.Screen name="colleges" options={{ title: 'Instituições' }} />
      <Drawer.Screen name="students" options={{ title: 'Alunos' }} />
      <Drawer.Screen name="enrollments" options={{ title: 'Matrículas' }} />
      <Drawer.Screen name="drivers" options={{ title: 'Motoristas' }} />
      <Drawer.Screen name="vehicles" options={{ title: 'Veiculos' }} />
      <Drawer.Screen name="routes" options={{ title: 'Rotas' }} />
      <Drawer.Screen name="stops" options={{ title: 'Paradas' }} />
      <Drawer.Screen name="payments" options={{ title: 'Cobrancas' }} />
      <Drawer.Screen name="audit-logs" options={{ title: 'Logs Auditoria' }} />
      <Drawer.Screen name="profile" options={{ title: 'Meu Perfil' }} />
    </Drawer>
  );
}
