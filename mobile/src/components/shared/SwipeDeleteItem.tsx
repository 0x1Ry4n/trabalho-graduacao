import React from 'react';
import { Box, Icon, Pressable } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';

interface SwipeDeleteItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  actionBg?: string;
}

export function SwipeDeleteItem({
  children,
  onDelete,
  actionBg = '#DC2626',
}: SwipeDeleteItemProps) {
  return (
    <Box mb="2" borderRadius="xl" overflow="hidden">
      <Swipeable
        overshootRight={false}
        renderRightActions={() => (
          <Pressable
            onPress={onDelete}
            w="20"
            bg={actionBg}
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={Ionicons} name="trash-outline" size="6" color="white" />
          </Pressable>
        )}
      >
        {children}
      </Swipeable>
    </Box>
  );
}
