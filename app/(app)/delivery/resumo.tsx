import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDeliveryStore } from '../../../src/store';

export default function ResumoScreen() {
  const router = useRouter();
  const store = useDeliveryStore();

  const handleNext = () => {
    router.push('/(app)/delivery/enviando');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* DADOS DA NOTA */}
        <View style={styles.card}>
          <Text style={styles.label}>Nota Fiscal</Text>
          <Text style={styles.value}>{store.nf}</Text>
          <View style={styles.spacing} />
          
          <Text style={styles.label}>Cliente</Text>
          <Text style={styles.value}>{store.cliente}</Text>
          <View style={styles.spacing} />

          <Text style={styles.label}>Cidade</Text>
          <Text style={styles.value}>{store.cidade}</Text>
        </View>

        {/* RECEBEDOR */}
        <Text style={styles.sectionTitle}>Recebedor</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="account" size={20} color="#FFD100" />
            <Text style={styles.rowLabel}>Nome</Text>
            <Text style={styles.rowValue}>{store.recebedorNome}</Text>
          </View>
          <View style={styles.row}>
            <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#FFD100" />
            <Text style={styles.rowLabel}>CPF</Text>
            <Text style={styles.rowValue}>{store.recebedorCpf}</Text>
          </View>
          <View style={styles.row}>
            <MaterialCommunityIcons name="account-group" size={20} color="#FFD100" />
            <Text style={styles.rowLabel}>Parentesco</Text>
            <Text style={styles.rowValue}>{store.recebedorParentesco}</Text>
          </View>
        </View>

        {/* FOTOS */}
        <Text style={styles.sectionTitle}>Fotos</Text>
        <View style={styles.photosGrid}>
          <View style={styles.photoContainer}>
            <Image source={{ uri: store.fotoEtiqueta || '' }} style={styles.photo} />
            <Text style={styles.photoLabel}>Etiqueta</Text>
            <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" style={styles.checkIcon} />
          </View>
          <View style={styles.photoContainer}>
            <Image source={{ uri: store.fotoNf || '' }} style={styles.photo} />
            <Text style={styles.photoLabel}>Nota Fiscal</Text>
            <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" style={styles.checkIcon} />
          </View>
          <View style={styles.photoContainer}>
            <Image source={{ uri: store.fotoProduto || '' }} style={styles.photo} />
            <Text style={styles.photoLabel}>Produto</Text>
            <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" style={styles.checkIcon} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnPrimary} onPress={handleNext}>
          <Text style={styles.btnPrimaryText}>ENVIAR ENTREGA</Text>
          <MaterialCommunityIcons name="arrow-right" size={24} color="#111" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  scroll: { padding: 24 },
  card: { backgroundColor: '#1C1C1C', borderRadius: 16, padding: 20, marginBottom: 24 },
  label: { color: '#888', fontSize: 12, marginBottom: 4 },
  value: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  spacing: { height: 16 },
  sectionTitle: { color: '#FFD100', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  rowLabel: { color: '#888', fontSize: 14, marginLeft: 8, width: 80 },
  rowValue: { color: '#FFF', fontSize: 14, fontWeight: 'bold', flex: 1 },
  photosGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  photoContainer: { alignItems: 'center', width: '30%' },
  photo: { width: '100%', height: 80, borderRadius: 8, backgroundColor: '#333' },
  photoLabel: { color: '#888', fontSize: 12, marginTop: 8 },
  checkIcon: { marginTop: 4 },
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
