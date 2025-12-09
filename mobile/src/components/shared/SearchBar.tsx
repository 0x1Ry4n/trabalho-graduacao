import React from 'react';
import { Box, Input, Icon, Pressable } from 'native-base';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Buscar...' }: SearchBarProps) {
  return (
    <Box px="3" py="2" bg="white" _dark={{ bg: 'coolGray.800' }} shadow="1">
      <Input
        variant="filled"
        bg="coolGray.50"
        _dark={{ bg: 'coolGray.700', borderColor: 'coolGray.600', color: 'coolGray.50', _focus: { borderColor: 'admin.400', bg: 'coolGray.700' } }}
        borderRadius="xl"
        fontSize="sm"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        InputLeftElement={
          <Icon as={Ionicons} name="search-outline" size="4" ml="3" color="coolGray.400" />
        }
        InputRightElement={
          value.length > 0 ? (
            <Pressable onPress={() => onChangeText('')} mr="2">
              <Icon as={Ionicons} name="close-circle" size="4" color="coolGray.400" />
            </Pressable>
          ) : undefined
        }
      />
    </Box>
  );
}
