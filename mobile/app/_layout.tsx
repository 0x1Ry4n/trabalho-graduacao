import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { NativeBaseProvider, useColorMode } from 'native-base';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../src/store/auth.store';
import { authEvents } from '../src/api/client';
import { useThemeStore } from '../src/store/theme.store';
import { initDatabase } from '../src/database/db';
import { nativeBaseTheme } from '../src/theme/nativebase.config';

// Polyfill: BackHandler.removeEventListener was removed in RN 0.75+
// but @react-navigation/drawer still references it internally
if (!(BackHandler as any).removeEventListener) {
  (BackHandler as any).removeEventListener = () => { };
}

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { loadFromStorage: loadAuth } = useAuthStore();
  const { loadFromStorage: loadTheme } = useThemeStore();
  const themeMode = useThemeStore((s) => s.mode);
  const { setColorMode } = useColorMode();

  useEffect(() => {
    async function init() {
      try {
        await Promise.all([initDatabase(), loadAuth(), loadTheme()]);
      } catch (e) {
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    init();
  }, []);

  useEffect(() => {
    setColorMode(themeMode);
  }, [themeMode, setColorMode]);

  // Navegacao por sessao expirada mora na camada de UI. O interceptor apenas
  // emite o evento e o store limpa o estado; nenhum dos dois conhece rotas.
  useEffect(() => {
    return authEvents.on('session:expired', () => {
      router.replace('/(auth)/login');
    });
  }, []);

  const isDark = themeMode === 'dark';

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(driver)" />
        <Stack.Screen name="(student)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NativeBaseProvider theme={nativeBaseTheme}>
        <AppContent />
      </NativeBaseProvider>
    </GestureHandlerRootView>
  );
}
