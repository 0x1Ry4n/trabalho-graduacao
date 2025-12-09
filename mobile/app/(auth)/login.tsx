import React, { useState } from 'react';
import {
  Box, VStack, HStack, Text, Input, Button, Icon, Pressable, KeyboardAvoidingView, ScrollView, Image,
} from 'native-base';
import { Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { UserRole } from '../../src/types';

const ROLE_HINTS = [
  { role: 'Admin', icon: 'shield-checkmark-outline', color: 'admin.600' },
  { role: 'Motorista', icon: 'bus-outline', color: 'driver.600' },
  { role: 'Estudante', icon: 'school-outline', color: 'student.600' },
];

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atencao', 'Preencha e-mail e senha.');
      return;
    }
    clearError();
    try {
      await login(email.trim(), password);
      const user = useAuthStore.getState().user;
      if (user?.role === UserRole.ADMIN) router.replace('/(admin)');
      else if (user?.role === UserRole.DRIVER) router.replace('/(driver)');
      else if (user?.role === UserRole.STUDENT) router.replace('/(student)');
    } catch { /* error handled by store */ }
  }

  return (
    <Box flex={1} bg="admin.700">
      <KeyboardAvoidingView flex={1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <VStack alignItems="center" mb="10">
            <Box
              w="24" h="24" borderRadius="3xl"
              bg="rgba(255,255,255,0.16)"
              borderWidth={1} borderColor="rgba(255,255,255,0.28)"
              alignItems="center" justifyContent="center" mb="4"
              overflow="hidden"
            >
              <Image
                source={require('../../assets/images/unipass-logo.png')}
                alt="Logo UniPass"
                w="24"
                h="24"
                resizeMode="cover"
              />
            </Box>
            <Text fontSize="3xl" fontWeight="900" color="white">UniPass</Text>
            <Text fontSize="sm" color="rgba(255,255,255,0.7)" mt="1" mb="5">Mobilidade Estudantil</Text>

            <HStack space={2}>
              {ROLE_HINTS.map(({ role, icon, color }) => (
                <Box key={role} bg="white" borderRadius="full" px="2.5" py="1" flexDirection="row" alignItems="center">
                  <Icon as={Ionicons} name={icon as never} size="3" color={color} mr="1" />
                  <Text fontSize="2xs" fontWeight="700" color={color}>{role}</Text>
                </Box>
              ))}
            </HStack>
          </VStack>

          <Box bg="white" _dark={{ bg: 'coolGray.800' }} borderRadius="3xl" p="6" shadow="9">
            <Text fontSize="xl" fontWeight="800" color="coolGray.800" _dark={{ color: 'white' }} mb="1">Entrar na conta</Text>
            <Text fontSize="sm" color="coolGray.500" mb="6">Use suas credenciais de acesso</Text>

            {error && (
              <Box bg="red.50" borderRadius="xl" p="3" mb="4" borderLeftWidth={3} borderLeftColor="red.500">
                <HStack alignItems="center" space={2}>
                  <Icon as={Ionicons} name="alert-circle" size="4" color="red.500" />
                  <Text fontSize="sm" color="red.600" fontWeight="500" flex={1}>{error}</Text>
                </HStack>
              </Box>
            )}

            <VStack space={4}>
              <Input
                placeholder="Digite o seu e-mail..."
                value={email}
                onChangeText={(t) => { clearError(); setEmail(t); }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                size="lg"
                borderRadius="xl"
                InputLeftElement={<Icon as={Ionicons} name="mail-outline" size="5" color="coolGray.400" ml="3" />}
              />

              <Input
                placeholder="Digite a sua senha..."
                value={password}
                onChangeText={(t) => { clearError(); setPassword(t); }}
                type={showPassword ? 'text' : 'password'}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                size="lg"
                borderRadius="xl"
                InputLeftElement={<Icon as={Ionicons} name="lock-closed-outline" size="5" color="coolGray.400" ml="3" />}
                InputRightElement={
                  <Pressable onPress={() => setShowPassword(!showPassword)} mr="3">
                    <Icon as={Ionicons} name={showPassword ? 'eye-off-outline' : 'eye-outline'} size="5" color="coolGray.400" />
                  </Pressable>
                }
              />

              <Button
                onPress={handleLogin}
                isLoading={isLoading}
                size="lg"
                borderRadius="xl"
                bg="admin.600"
                _pressed={{ bg: 'admin.700' }}
                mt="2"
                leftIcon={<Icon as={Ionicons} name="log-in-outline" size="5" color="white" />}
              >
                <Text color="white" fontSize="md" fontWeight="700">Entrar</Text>
              </Button>
            </VStack>
          </Box>

          <Text textAlign="center" color="rgba(255,255,255,0.4)" fontSize="xs" mt="6">
            UniPass {new Date().getFullYear()}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Box>
  );
}
