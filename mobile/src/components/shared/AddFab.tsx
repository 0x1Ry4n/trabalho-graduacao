import React from 'react';
import { Fab, Icon } from 'native-base';
import { Ionicons } from '@expo/vector-icons';

interface AddFabProps {
  onPress: () => void;
  bg: string;
  pressedBg: string;
}

export function AddFab({ onPress, bg, pressedBg }: AddFabProps) {
  return (
    <Fab
      renderInPortal={false}
      shadow="6"
      size="lg"
      icon={<Icon as={Ionicons} name="add" color="white" size="6" />}
      bg={bg}
      _pressed={{ bg: pressedBg }}
      onPress={onPress}
      bottom="6"
      right="5"
    />
  );
}
