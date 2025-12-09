import React from 'react';
import { VStack, Text } from 'native-base';

export function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <VStack py="2" space={1} borderBottomWidth={1} borderBottomColor="coolGray.50" _dark={{ borderBottomColor: 'coolGray.700' }}>
      <Text fontSize="xs" color="coolGray.500" fontWeight="500">{label}</Text>
      <Text fontSize="sm" color="coolGray.800" _dark={{ color: 'coolGray.200' }}>{value}</Text>
    </VStack>
  );
}
