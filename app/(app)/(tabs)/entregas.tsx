import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { supabase } from '../../../src/services/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import React from 'react';
import { useDeliveryStore } from '../../../src/store';

export default function EntregasScreen() {
  const router = useRouter();
  const [entregas, setEntregas] = useState<any[]>([]);
  const [filter, setFilter] = useState('Todas');
  
  const TABS = ['Todas', 'Pendentes', 'Enviadas', 'Erro'];

  const fetchEntregas = async () => {
    const { data } = await supabase
      .from('deliveries')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setEntregas(data);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchEntregas();
    }, [])
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enviada': return { bg: '#1E3A20', text: '#4CAF50' };
      case 'pendente': return { bg: '#3E3410', text: '#FFD100' };
      case 'erro': return { bg: '#3A1E1E', text: '#F44336' };
      default: return { bg: '#333', text: '#FFF' };
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const filteredEntregas = entregas.filter(e => {
    if (filter === 'Todas') return true;
    if (filter === 'Pendentes' && e.status === 'pendente') return true;
    if (filter === 'Enviadas' && e.status === 'enviada') return true;
    if (filter === 'Erro' && e.status === 'erro') return true;
    return false;
  });

  const handlePressDelivery = (item: any) => {
    if (item.status === 'pendente') {
      // Popula o Zustand com os dados reais vindos do Supabase
      useDeliveryStore.getState().setNotaData(item.invoice_number, item.client_name, item.city);
      // Navega para a tela de Dados da Nota
      router.push('/(app)/delivery/nota');
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusObj = getStatusColor(item.status);
    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={item.status === 'pendente' ? 0.7 : 1}
        onPress={() => handlePressDelivery(item)}
      >
        <View style={styles.cardLeft}>
          <Text style={styles.nf}>{item.invoice_number}</Text>
          <Text style={styles.cliente}>{item.client_name}</Text>
          <Text style={styles.recebedor}>{item.receiver_name || 'Sem recebedor'}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.date}>{formatDate(item.created_at)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusObj.bg }]}>
            <Text style={[styles.statusText, { color: statusObj.text }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Entregas</Text>
        <MaterialCommunityIcons name="filter-variant" size={24} color="#111" />
      </View>

      <View style={styles.tabs}>
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

      <FlatList
        data={filteredEntregas}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
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
    paddingTop: 64, // Status bar
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  tabs: { flexDirection: 'row', backgroundColor: '#111', padding: 16 },
  tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginRight: 8, backgroundColor: '#1C1C1C' },
  tabActive: { backgroundColor: '#FFD100' },
  tabText: { color: '#888', fontSize: 12, fontWeight: 'bold' },
  tabTextActive: { color: '#111' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardLeft: { flex: 1 },
  nf: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  cliente: { color: '#888', fontSize: 14, marginBottom: 4 },
  recebedor: { color: '#666', fontSize: 12 },
  cardRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  date: { color: '#888', fontSize: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold' }
});
