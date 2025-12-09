import React from 'react';
import {
  Modal, Input, Icon, ScrollView, Text,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from './EmptyState';

interface SearchModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  placeholder: string;
  items: T[];
  search: string;
  onSearch: (text: string) => void;
  filterFn: (item: T, query: string) => boolean;
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  emptyIcon: string;
  emptyMessage: string;
}

export function SearchModal<T>({
  isOpen,
  onClose,
  title,
  placeholder,
  items,
  search,
  onSearch,
  filterFn,
  keyExtractor,
  renderItem,
  emptyIcon,
  emptyMessage,
}: SearchModalProps<T>) {
  const filtered = search.trim()
    ? items.filter((item) => filterFn(item, search.toLowerCase()))
    : items;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <Modal.Content maxH="90%" borderRadius="2xl" mt="16" mb="auto" mx="3">
        <Modal.CloseButton />
        <Modal.Header borderBottomWidth={0}>
          <Text fontSize="lg" fontWeight="700">{title}</Text>
        </Modal.Header>
        <Modal.Body>
          <Input
            variant="filled"
            bg="coolGray.50"
            borderRadius="xl"
            borderColor="coolGray.300"
            _dark={{ bg: 'coolGray.700', borderColor: 'coolGray.600', color: 'coolGray.50', _focus: { borderColor: 'admin.400', bg: 'coolGray.700' } }}
            _focus={{ borderColor: 'admin.600', bg: 'white' }}
            fontSize="sm"
            placeholder={placeholder}
            value={search}
            onChangeText={onSearch}
            InputLeftElement={
              <Icon as={Ionicons} name="search-outline" size="4" ml="3" color="coolGray.400" />
            }
            mb="3"
          />
          <ScrollView showsVerticalScrollIndicator={false}>
            {filtered.length > 0
              ? filtered.map((item) => (
                  <React.Fragment key={keyExtractor(item)}>
                    {renderItem(item)}
                  </React.Fragment>
                ))
              : <EmptyState icon={emptyIcon} message={emptyMessage} pt="8" />}
          </ScrollView>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
