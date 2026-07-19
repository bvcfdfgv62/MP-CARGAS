import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { supabase } from '../../../src/services/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import React from 'react';
import { useDeliveryStore } from '../../../src/store';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function EntregasScreen() {
  const router = useRouter();
  const [entregas, setEntregas] = useState<any[]>([]);
  const [filter, setFilter] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  
  // States para o Scanner
  const [permission, requestPermission] = useCameraPermissions();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanned, setScanned] = useState(false);

  const TABS = ['Todas', 'Pendentes', 'Enviadas', 'Erro'];

  const fetchEntregas = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const { data } = await supabase
      .from('deliveries')
      .select('*')
      .eq('driver_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (data) setEntregas(data);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchEntregas();
    }, [])
  );

  const filteredEntregas = entregas.filter(e => {
    // Filtro por Tab
    if (filter === 'Pendentes' && e.status !== 'pendente') return false;
    if (filter === 'Enviadas' && e.status !== 'enviada') return false;
    if (filter === 'Erro' && e.status !== 'erro') return false;
    
    // Filtro por Busca (NF ou Cliente)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!e.invoice_number.includes(q) && !e.client_name.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handlePressDelivery = (item: any) => {
    if (item.status === 'pendente') {
      useDeliveryStore.getState().setNotaData(item.invoice_number, item.client_name, item.city);
      router.push('/(app)/delivery/nota');
    }
  };

  const handleBarcodeScanned = ({ type, data }: { type: string, data: string }) => {
    setScanned(true);
    // Tenta encontrar a entrega pelo texto lido (ex: se o QR tiver apenas o número da NF)
    // Se o seu QR for um link completo, você precisaria de um parser aqui.
    // Assumimos que o QR contém o número da NF exato.
    const nfEncontrada = entregas.find(e => e.invoice_number === data || data.includes(e.invoice_number));
    
    setIsScannerOpen(false);
    
    if (nfEncontrada) {
      if (nfEncontrada.status === 'pendente') {
        handlePressDelivery(nfEncontrada);
      } else {
        Alert.alert("Já Entregue", `A NF ${nfEncontrada.invoice_number} já foi finalizada.`);
      }
    } else {
      Alert.alert("Não Encontrada", `Nenhuma entrega encontrada para o código:\n${data}`);
    }
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("Permissão negada", "Precisamos de acesso à câmera para ler QR Codes.");
        return;
      }
    }
    setScanned(false);
    setIsScannerOpen(true);
  };

  const renderItem = ({ item }: { item: any }) => {
    const isPendente = item.status === 'pendente';
    return (
      <TouchableOpacity 
        style={[styles.card, isPendente && styles.cardHighlight]} 
        activeOpacity={isPendente ? 0.7 : 1}
        onPress={() => handlePressDelivery(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.rowCenter}>
            <View style={[styles.iconBox, { backgroundColor: isPendente ? '#FFF7ED' : '#F0FDF4' }]}>
              <MaterialCommunityIcons name={isPendente ? "truck-fast" : "check-circle"} size={24} color={isPendente ? "#EA580C" : "#16A34A"} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.cardNf}>NF {item.invoice_number}</Text>
              <Text style={styles.cardClient}>{item.client_name}</Text>
            </View>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: isPendente ? '#EA580C' : '#16A34A' }]}>
            <Text style={styles.statusBadgeText}>{isPendente ? 'NA RUA' : 'ENTREGUE'}</Text>
          </View>
        </View>

        {isPendente && (
          <View style={styles.cardAction}>
            <Text style={styles.cardActionText}>INICIAR ENTREGA</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#111" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Minhas Rotas</Text>
        <MaterialCommunityIcons name="bell-outline" size={26} color="#111" />
      </View>

      {/* SEARCH BAR & QR CODE */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={24} color="#666" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Pesquisar NF ou Cliente..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={styles.qrButton} onPress={openScanner}>
          <MaterialCommunityIcons name="qrcode-scan" size={24} color="#111" />
        </TouchableOpacity>
      </View>

      {/* TABS */}
      <View style={styles.tabsScroll}>
        {TABS.map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, filter === tab && styles.tabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.tabText, filter === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LISTA */}
      <FlatList
        data={filteredEntregas}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="clipboard-text-off-outline" size={64} color="#333" />
            <Text style={styles.emptyTitle}>Nenhuma entrega encontrada</Text>
            <Text style={styles.emptySub}>Você está livre por enquanto!</Text>
          </View>
        }
      />

      {/* MODAL SCANNER QR */}
      <Modal visible={isScannerOpen} animationType="slide" transparent={false}>
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={() => setIsScannerOpen(false)} style={styles.scannerClose}>
              <MaterialCommunityIcons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Ler QR Code da Caixa</Text>
            <View style={{ width: 28 }} />
          </View>

          <CameraView 
            style={styles.camera} 
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          >
            <View style={styles.maskContainer}>
              <View style={styles.maskFrame} />
              <Text style={styles.maskText}>Aponte a câmera para o QR Code da etiqueta</Text>
            </View>
          </CameraView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  header: {
    backgroundColor: '#FFD100',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 64, // Status bar safe area
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: { fontSize: 24, fontWeight: '900', color: '#111', letterSpacing: -0.5 },
  
  searchContainer: { flexDirection: 'row', padding: 16, gap: 12, marginTop: -20 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, height: 56, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  searchInput: { flex: 1, height: '100%', marginLeft: 12, fontSize: 16, color: '#111', fontWeight: '500' },
  qrButton: { width: 56, height: 56, backgroundColor: '#FFD100', borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#FFD100', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },

  tabsScroll: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 },
  tab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8, backgroundColor: '#1C1C1C', borderWidth: 1, borderColor: '#333' },
  tabActive: { backgroundColor: '#FFF', borderColor: '#FFF' },
  tabText: { color: '#888', fontSize: 13, fontWeight: 'bold' },
  tabTextActive: { color: '#111' },
  
  list: { padding: 16, paddingBottom: 100 },
  
  card: { backgroundColor: '#1C1C1C', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#222' },
  cardHighlight: { borderColor: '#FFD100', borderWidth: 1.5, backgroundColor: '#1A1910' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cardNf: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  cardClient: { color: '#888', fontSize: 14, fontWeight: '500' },
  
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusBadgeText: { fontSize: 10, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  
  cardAction: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFD100', marginTop: 20, paddingVertical: 14, borderRadius: 12, gap: 8 },
  cardActionText: { fontSize: 14, fontWeight: '900', color: '#111', letterSpacing: 1 },

  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  emptyTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptySub: { color: '#666', fontSize: 14, marginTop: 8 },

  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scannerHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, backgroundColor: 'rgba(0,0,0,0.5)' },
  scannerClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  scannerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  camera: { flex: 1 },
  maskContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  maskFrame: { width: 280, height: 280, borderWidth: 4, borderColor: '#FFD100', borderRadius: 24, backgroundColor: 'transparent' },
  maskText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 32, textAlign: 'center', paddingHorizontal: 40 }
});
