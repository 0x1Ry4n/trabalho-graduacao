import React from 'react';
import { Box, Spinner } from 'native-base';

interface LoadingSpinnerProps {
  color?: string;
}

export function LoadingSpinner({ color = 'admin.600' }: LoadingSpinnerProps) {
  return (
    <Box flex={1} justifyContent="center" alignItems="center" bg="coolGray.50">
      <Spinner size="lg" color={color} />
    </Box>
  );
}
