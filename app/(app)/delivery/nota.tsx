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
      <View style={styles.headerBar}>
        <MaterialCommunityIcons name="text-box-check" size={32} color="#111" />
        <Text style={styles.headerTitle}>Dados da Entrega</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>NÚMERO DA NF</Text>
            <Text style={styles.valueHighlight}>{store.nf || 'Não informada'}</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.field}>
            <Text style={styles.label}>CLIENTE</Text>
            <Text style={styles.value}>{store.cliente || 'Não informado'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.field}>
            <Text style={styles.label}>CIDADE DESTINO</Text>
            <Text style={styles.value}>{store.cidade || 'Não informada'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.field}>
            <Text style={styles.label}>DATA DE EMISSÃO</Text>
            <Text style={styles.value}>{hoje}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.field}>
            <Text style={styles.label}>MOTORISTA RESPONSÁVEL</Text>
            <Text style={styles.value}>{motoristaNome}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnPrimary} onPress={handleNext}>
          <Text style={styles.btnPrimaryText}>INICIAR ROTA DE ENTREGA</Text>
          <MaterialCommunityIcons name="truck-fast" size={24} color="#111" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  headerBar: { backgroundColor: '#FFD100', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, paddingTop: 40, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, gap: 12 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#111', textTransform: 'uppercase' },
  scroll: { padding: 24, paddingTop: 32 },
  card: { backgroundColor: '#141414', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#222', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 12 },
  field: { marginVertical: 12 },
  label: { color: '#666', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  valueHighlight: { color: '#FFD100', fontSize: 24, fontWeight: '900' },
  value: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#222', marginVertical: 8 },
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
