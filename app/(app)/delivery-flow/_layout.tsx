import { Stack } from 'expo-router';

export default function DeliveryFlowLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#111111',
        },
        headerTintColor: '#FFD100',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen name="scanner" options={{ title: 'Escanear NF' }} />
      <Stack.Screen name="photos" options={{ title: 'Fotos da Entrega' }} />
      <Stack.Screen name="receiver" options={{ title: 'Dados do Recebedor' }} />
      <Stack.Screen name="summary" options={{ title: 'Resumo da Entrega' }} />
    </Stack>
  );
}
