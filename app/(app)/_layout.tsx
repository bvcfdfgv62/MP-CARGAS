import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function AppLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 800, backgroundColor: '#111' }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="delivery" />
        </Stack>
      </View>
    </View>
  );
}
