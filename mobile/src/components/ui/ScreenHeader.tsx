import React from 'react';
import { Box, HStack, Text, Pressable, Icon } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { router } from 'expo-router';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  bg?: string;
  showBack?: boolean;
  showMenu?: boolean;
  rightContent?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  bg = '#1E40AF',
  showBack = false,
  showMenu = true,
  rightContent,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <Box bg={bg} pt={`${insets.top + 8}px`} pb="4" px="4">
      <HStack alignItems="center" space={3}>
        {showBack ? (
          <Pressable onPress={() => router.back()} p="1" borderRadius="lg">
            <Icon as={Ionicons} name="arrow-back" size="6" color="white" />
          </Pressable>
        ) : showMenu ? (
          <Pressable
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            p="1"
            borderRadius="lg"
          >
            <Icon as={Ionicons} name="menu" size="6" color="white" />
          </Pressable>
        ) : null}

        <Box flex={1}>
          <Text color="white" fontSize="lg" fontWeight="800" numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text color="rgba(255,255,255,0.7)" fontSize="xs">
              {subtitle}
            </Text>
          )}
        </Box>

        {rightContent}
      </HStack>
    </Box>
  );
}
