import React from 'react';
import { router } from 'expo-router';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
  Icon,
  Divider,
  Switch,
  ScrollView,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { useTheme } from '../../hooks/useTheme';

interface DrawerConfig {
  accentColor: string;
  accentScheme: string;
  roleLabel: string;
  roleIcon: string;
  items: {
    name: string;
    label: string;
    icon: string;
  }[];
}

interface CustomDrawerProps extends DrawerContentComponentProps {
  config: DrawerConfig;
}

export function CustomDrawerContent({ state, navigation, config }: CustomDrawerProps) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();

  const initials = (user?.username ?? 'U').slice(0, 2).toUpperCase();

  function handleLogout() {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <Box flex={1} bg="white" _dark={{ bg: 'coolGray.900' }}>
      {/* Header */}
      <Box
        bg={config.accentColor}
        pt={`${insets.top + 16}px`}
        pb="6"
        px="5"
      >
        <HStack alignItems="center" space={3}>
          <Box
            w="10" h="10" borderRadius="full"
            bg="rgba(255,255,255,0.2)"
            borderWidth={2}
            borderColor="rgba(255,255,255,0.35)"
            alignItems="center" justifyContent="center"
          >
            <Text color="white" fontWeight="800" fontSize="md">
              {initials}
            </Text>
          </Box>
          <VStack flex={1}>
            <Text color="rgba(255,255,255,0.7)" fontSize="xs" fontWeight="500">
              Bem-vindo
            </Text>
            <Text color="white" fontSize="md" fontWeight="700" numberOfLines={1}>
              {user?.username}
            </Text>
          </VStack>
        </HStack>
        <HStack mt="3">
          <Box
            bg="rgba(255,255,255,0.15)"
            px="3"
            py="1"
            borderRadius="full"
          >
            <HStack alignItems="center" space={1}>
              <Icon
                as={Ionicons}
                name={config.roleIcon as any}
                size="3"
                color="white"
              />
              <Text color="white" fontSize="2xs" fontWeight="700">
                {config.roleLabel}
              </Text>
            </HStack>
          </Box>
        </HStack>
      </Box>

      {/* Navigation Items */}
      <ScrollView flex={1} py="2">
        <VStack space={1} px="3">
          {config.items.map((item, idx) => {
            const routeIndex = state.routes.findIndex((r) => r.name === item.name);
            const isActive = state.index === routeIndex;

            return (
              <Pressable
                key={item.name}
                onPress={() => {
                  if (config.roleLabel === 'Administrador' && item.name === 'payments') {
                    router.replace('/(admin)/payments');
                    navigation.closeDrawer();
                    return;
                  }

                  navigation.navigate(item.name);
                }}
                borderRadius="xl"
                bg={isActive ? `${config.accentScheme}.50` : 'transparent'}
                _pressed={{ bg: `${config.accentScheme}.50` }}
                px="4"
                py="3"
              >
                <HStack alignItems="center" space={3}>
                  <Icon
                    as={Ionicons}
                    name={item.icon as any}
                    size="5"
                    color={isActive ? config.accentColor : 'coolGray.500'}
                  />
                  <Text
                    fontSize="sm"
                    fontWeight={isActive ? '700' : '500'}
                    color={isActive ? config.accentColor : 'coolGray.700'}
                    _dark={{
                      color: isActive ? config.accentColor : 'coolGray.300',
                    }}
                  >
                    {item.label}
                  </Text>
                  {isActive && (
                    <Box
                      ml="auto"
                      w="2"
                      h="2"
                      borderRadius="full"
                      bg={config.accentColor}
                    />
                  )}
                </HStack>
              </Pressable>
            );
          })}
        </VStack>
      </ScrollView>

      {/* Footer */}
      <Divider _dark={{ bg: 'coolGray.700' }} />
      <VStack px="4" py="3" pb={`${Math.max(insets.bottom, 12)}px`} space={2}>
        {/* Theme toggle */}
        <HStack alignItems="center" justifyContent="space-between" py="2">
          <HStack alignItems="center" space={3}>
            <Icon
              as={Ionicons}
              name={isDark ? 'moon' : 'sunny-outline'}
              size="5"
              color="coolGray.500"
            />
            <Text fontSize="sm" fontWeight="500" color="coolGray.700" _dark={{ color: 'coolGray.300' }}>
              Tema escuro
            </Text>
          </HStack>
          <Switch
            size="sm"
            isChecked={isDark}
            onToggle={toggleTheme}
            onTrackColor={`${config.accentScheme}.500`}
          />
        </HStack>

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          borderRadius="xl"
          bg="red.50"
          _dark={{ bg: 'red.900:alpha.30' }}
          _pressed={{ bg: 'red.100' }}
          px="4"
          py="3"
        >
          <HStack alignItems="center" space={3}>
            <Icon as={Ionicons} name="log-out-outline" size="5" color="red.500" />
            <Text fontSize="sm" fontWeight="600" color="red.500">
              Sair da conta
            </Text>
          </HStack>
        </Pressable>
      </VStack>
    </Box>
  );
}
