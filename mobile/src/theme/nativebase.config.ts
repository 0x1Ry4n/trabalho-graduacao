import { extendTheme } from 'native-base';

export const nativeBaseTheme = extendTheme({
  colors: {
    admin: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#1E40AF',
      700: '#1E3A8A',
      800: '#1E3A8A',
      900: '#172554',
    },
    driver: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: '#10B981',
      600: '#059669',
      700: '#047857',
      800: '#065F46',
      900: '#064E3B',
    },
    student: {
      50: '#F5F3FF',
      100: '#EDE9FE',
      200: '#DDD6FE',
      300: '#C4B5FD',
      400: '#A78BFA',
      500: '#8B5CF6',
      600: '#7C3AED',
      700: '#6D28D9',
      800: '#5B21B6',
      900: '#4C1D95',
    },
  },
  fontConfig: {
    heading: { fontWeight: '700' },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'admin',
        borderRadius: 'lg',
      },
      variants: {
        solid: ({ colorScheme }: any) => ({
          bg: `${colorScheme}.600`,
          _pressed: { bg: `${colorScheme}.700` },
          _text: { fontWeight: '600' },
        }),
        outline: ({ colorScheme }: any) => ({
          borderColor: `${colorScheme}.600`,
          _text: { color: `${colorScheme}.600`, fontWeight: '600' },
          _pressed: { bg: `${colorScheme}.50` },
        }),
        ghost: ({ colorScheme }: any) => ({
          _text: { color: `${colorScheme}.600` },
          _pressed: { bg: `${colorScheme}.50` },
        }),
      },
    },
    Input: {
      defaultProps: {
        borderRadius: 'lg',
        fontSize: 'md',
        bg: 'coolGray.50',
        borderColor: 'coolGray.200',
        color: 'coolGray.900',
        placeholderTextColor: 'coolGray.400',
        _focus: {
          borderColor: 'admin.600',
          bg: 'white',
        },
        _dark: {
          bg: 'coolGray.700',
          borderColor: 'coolGray.600',
          color: 'coolGray.50',
          placeholderTextColor: 'coolGray.400',
          _focus: {
            borderColor: 'admin.400',
            bg: 'coolGray.700',
          },
        },
      },
    },
    TextArea: {
      defaultProps: {
        borderRadius: 'lg',
        fontSize: 'md',
        bg: 'coolGray.50',
        borderColor: 'coolGray.200',
        color: 'coolGray.900',
        placeholderTextColor: 'coolGray.400',
        _focus: {
          borderColor: 'admin.600',
          bg: 'white',
        },
        _dark: {
          bg: 'coolGray.700',
          borderColor: 'coolGray.600',
          color: 'coolGray.50',
          placeholderTextColor: 'coolGray.400',
          _focus: {
            borderColor: 'admin.400',
            bg: 'coolGray.700',
          },
        },
      },
    },
    Select: {
      defaultProps: {
        borderRadius: 'lg',
        fontSize: 'md',
        bg: 'coolGray.50',
        borderColor: 'coolGray.200',
        color: 'coolGray.900',
        placeholderTextColor: 'coolGray.400',
        _focus: {
          borderColor: 'admin.600',
          bg: 'white',
        },
        _selectedItem: {
          bg: 'admin.50',
        },
        _dark: {
          bg: 'coolGray.700',
          borderColor: 'coolGray.600',
          color: 'coolGray.50',
          placeholderTextColor: 'coolGray.400',
          _focus: {
            borderColor: 'admin.400',
            bg: 'coolGray.700',
          },
          _selectedItem: {
            bg: 'coolGray.600',
          },
        },
      },
    },
    Badge: {
      defaultProps: {
        borderRadius: 'full',
      },
    },
  },
  config: {
    initialColorMode: 'light',
  },
});
