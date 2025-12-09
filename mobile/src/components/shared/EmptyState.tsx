import React from 'react';
import { VStack, Icon, Text } from 'native-base';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon: string;
  message: string;
  pt?: string;
  flex?: number;
}

export function EmptyState({ icon, message, pt = '16', flex }: EmptyStateProps) {
  return (
    <VStack alignItems="center" justifyContent={flex ? 'center' : undefined} pt={flex ? undefined : pt} flex={flex} space={3}>
      <Icon as={Ionicons} name={icon as never} size="12" color="coolGray.300" />
      <Text color="coolGray.400" fontSize="md">{message}</Text>
    </VStack>
  );
}
