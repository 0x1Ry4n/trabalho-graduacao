import { Stack } from 'expo-router';

export default function AuditLogsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Logs Auditoria' }} />
        </Stack>
    );
}