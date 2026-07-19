import { Stack } from 'expo-router';

export default function DeliveryLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: true, 
      headerStyle: { backgroundColor: '#FFD100' },
      headerTintColor: '#111',
      headerTitleStyle: { fontWeight: 'bold' },
      headerShadowVisible: false
    }}>
      <Stack.Screen name="nota" options={{ title: 'Dados da Nota' }} />
      <Stack.Screen name="camera-etiqueta" options={{ title: 'Foto da Etiqueta' }} />
      <Stack.Screen name="camera-nf" options={{ title: 'Foto da Nota Fiscal' }} />
      <Stack.Screen name="camera-produto" options={{ title: 'Foto do Produto' }} />
      <Stack.Screen name="recebedor" options={{ title: 'Dados do Recebedor' }} />
      <Stack.Screen name="resumo" options={{ title: 'Resumo da Entrega' }} />
      <Stack.Screen name="enviando" options={{ headerShown: false }} />
      <Stack.Screen name="confirmacao" options={{ headerShown: false }} />
    </Stack>
  );
}
