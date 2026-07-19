import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useDeliveryStore } from '../../../src/store';
import { supabase } from '../../../src/services/supabase';

export default function NotaScreen() {
  const router = useRouter();
  const store = useDeliveryStore();
  const [hoje, setHoje] = useState('');
  const [motoristaNome, setMotoristaNome] = useState('Motorista');

  useEffect(() => {
    // Busca o nome do motorista
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.name) {
        setMotoristaNome(user.user_metadata.name.split(' ')[0]);
      }
    });

    const date = new Date();
    setHoje(`${date.getDate().toString().padStart(2, '0')}/${(date.getMonth()+1).toString().padStart(2, '0')}/${date.getFullYear()}`);
  }, []);

  const handleNext = () => {
    router.push('/(app)/delivery/camera-etiqueta');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.successText}>Nota Fiscal encontrada!</Text>

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Número da NF</Text>
            <Text style={styles.value}>{store.nf || 'Não informada'}</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.field}>
            <Text style={styles.label}>Cliente</Text>
            <Text style={styles.value}>{store.cliente || 'Não informado'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.field}>
            <Text style={styles.label}>Cidade</Text>
            <Text style={styles.value}>{store.cidade || 'Não informada'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.field}>
            <Text style={styles.label}>Data de Emissão</Text>
            <Text style={styles.value}>{hoje}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.field}>
            <Text style={styles.label}>Motorista</Text>
            <Text style={styles.value}>{motoristaNome}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnPrimary} onPress={handleNext}>
          <Text style={styles.btnPrimaryText}>INICIAR ENTREGA</Text>
          <MaterialCommunityIcons name="arrow-right" size={24} color="#111" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  scroll: { padding: 24 },
  successText: { color: '#FFD100', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 24, marginTop: 16 },
  card: { backgroundColor: '#1C1C1C', borderRadius: 16, padding: 20 },
  field: { marginVertical: 12 },
  label: { color: '#888', fontSize: 14, marginBottom: 4 },
  value: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#333' },
  footer: { padding: 24, paddingBottom: 40 },
  btnPrimary: {
    backgroundColor: '#FFD100',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  btnPrimaryText: { color: '#111', fontWeight: 'bold', fontSize: 16 },
});
