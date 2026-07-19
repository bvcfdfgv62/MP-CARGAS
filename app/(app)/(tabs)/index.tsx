import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../src/services/supabase';
import { useDeliveryStore } from '../../../src/store';

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('Motorista');
  const clearDelivery = useDeliveryStore(state => state.clearDelivery);

  useEffect(() => {
    // Busca o nome real do motorista do Supabase
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.name) {
        setUserName(user.user_metadata.name.split(' ')[0]);
      }
    });
  }, []);

  const handleStartDelivery = () => {
    clearDelivery();
    // Navega para a primeira etapa do fluxo de entrega
    router.push('/(app)/delivery/nota');
  };

  return (
    <View style={styles.container}>
      {/* Header com curva amarela */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.logoText}>MP</Text>
            <Text style={styles.logoSubText}>CARGAS</Text>
          </View>
          <MaterialCommunityIcons name="bell" size={24} color="#111" />
        </View>
        <Text style={styles.greeting}>Olá, {userName}</Text>
        <Text style={styles.role}>Motorista</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <MaterialCommunityIcons name="package-variant-closed" size={48} color="#FFD100" style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Nova Entrega</Text>
          <Text style={styles.cardSubtitle}>Escaneie o QR Code da Nota Fiscal</Text>

          <TouchableOpacity style={styles.btnPrimary} onPress={handleStartDelivery}>
            <MaterialCommunityIcons name="qrcode-scan" size={24} color="#111" />
            <Text style={styles.btnPrimaryText}>ESCANEAR QR CODE</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary} onPress={handleStartDelivery}>
            <MaterialCommunityIcons name="pencil" size={24} color="#FFF" />
            <Text style={styles.btnSecondaryText}>DIGITAR NOTA FISCAL</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  header: {
    backgroundColor: '#FFD100',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    padding: 24,
    paddingTop: 64, // espaco da status bar
    paddingBottom: 40,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  logoText: { fontSize: 32, fontWeight: '900', fontStyle: 'italic', color: '#111', lineHeight: 32 },
  logoSubText: { fontSize: 12, fontWeight: 'bold', color: '#111', marginTop: -4 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  role: { fontSize: 16, color: '#333' },
  content: { padding: 24, flex: 1, justifyContent: 'center', marginTop: -40 },
  card: {
    backgroundColor: '#1C1C1C',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardIcon: { marginBottom: 16 },
  cardTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
  cardSubtitle: { fontSize: 14, color: '#888', marginBottom: 32, textAlign: 'center' },
  btnPrimary: {
    backgroundColor: '#FFD100',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
    gap: 8,
  },
  btnPrimaryText: { color: '#111', fontWeight: 'bold', fontSize: 16 },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    gap: 8,
  },
  btnSecondaryText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
