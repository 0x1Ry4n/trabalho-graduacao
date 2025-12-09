import React from 'react';
import { Box, Text, VStack, HStack, Icon } from 'native-base';
import { Ionicons } from '@expo/vector-icons';

interface ErrorDisplayProps {
    error: string | null;
    onDismiss?: () => void;
    showIcon?: boolean;
}

/**
 * Component for displaying error messages consistently across the app
 */
export function ErrorDisplay({ error, onDismiss, showIcon = true }: ErrorDisplayProps) {
    if (!error) return null;

    return (
        <Box
            bg="red.50"
            _dark={{ bg: 'red.900' }}
            borderRadius="lg"
            p="3"
            borderWidth={1}
            borderColor="red.200"
        >
            <HStack alignItems="flex-start" space={2}>
                {showIcon && (
                    <Icon
                        as={Ionicons}
                        name="warning-outline"
                        size="4"
                        color="red.500"
                        mt="0.5"
                    />
                )}
                <VStack flex={1}>
                    <Text fontSize="sm" color="red.700" _dark={{ color: 'red.300' }}>
                        {error}
                    </Text>
                </VStack>
                {onDismiss && (
                    <Icon
                        as={Ionicons}
                        name="close-outline"
                        size="4"
                        color="red.500"
                        onPress={onDismiss}
                        cursor="pointer"
                    />
                )}
            </HStack>
        </Box>
    );
}

interface FormErrorProps {
    errors: string[];
    onDismiss?: () => void;
}

/**
 * Component for displaying multiple form validation errors
 */
export function FormError({ errors, onDismiss }: FormErrorProps) {
    if (!errors || errors.length === 0) return null;

    return (
        <Box
            bg="red.50"
            _dark={{ bg: 'red.900' }}
            borderRadius="lg"
            p="3"
            borderWidth={1}
            borderColor="red.200"
        >
            <HStack alignItems="flex-start" space={2}>
                <Icon
                    as={Ionicons}
                    name="warning-outline"
                    size="4"
                    color="red.500"
                    mt="0.5"
                />
                <VStack flex={1} space={1}>
                    {errors.map((error, index) => (
                        <Text key={index} fontSize="sm" color="red.700" _dark={{ color: 'red.300' }}>
                            • {error}
                        </Text>
                    ))}
                </VStack>
                {onDismiss && (
                    <Icon
                        as={Ionicons}
                        name="close-outline"
                        size="4"
                        color="red.500"
                        onPress={onDismiss}
                        cursor="pointer"
                    />
                )}
            </HStack>
        </Box>
    );
}