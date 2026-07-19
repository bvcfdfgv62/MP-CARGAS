import { View, Text, StyleSheet } from 'react-native';

export default function DeliveriesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Entregas</Text>
      <Text style={styles.subtitle}>Lista de entregas do dia</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111111',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});
