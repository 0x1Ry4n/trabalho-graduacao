import React from 'react';
import { HStack, Icon, Pressable, Text } from 'native-base';
import { Ionicons } from '@expo/vector-icons';

type TopRefreshButtonProps = {
  onPress: () => void;
  label?: string;
  bgColor?: string;
  pressedBgColor?: string;
  size?: 'sm' | 'md';
};

export function TopRefreshButton({
  onPress,
  label = 'Atualizar',
  bgColor = '#7C3AED',
  pressedBgColor = '#6D28D9',
  size = 'md',
}: TopRefreshButtonProps) {
  const isSmall = size === 'sm';

  return (
    <Pressable
      onPress={onPress}
      alignSelf="flex-start"
      bg={bgColor}
      px={isSmall ? '3' : '4'}
      py={isSmall ? '2' : '2.5'}
      borderRadius={isSmall ? 'lg' : 'xl'}
      _pressed={{ bg: pressedBgColor }}
    >
      <HStack alignItems="center" space={2}>
        <Icon as={Ionicons} name="refresh" size={isSmall ? '3.5' : '4'} color="white" />
        <Text fontSize={isSmall ? 'xs' : 'sm'} fontWeight="600" color="white">
          {label}
        </Text>
      </HStack>
    </Pressable>
  );
}
