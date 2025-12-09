import { Stack } from 'expo-router';

export default function EnrollmentsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Matrículas' }} />
            <Stack.Screen name="[id]" options={{ title: 'Detalhes da Matrícula' }} />
        </Stack>
    );
}