import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, ActivityIndicator, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../src/services/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [motoristas, setMotoristas] = useState<any[]>([]);
  const [entregas, setEntregas] = useState<any[]>([]);
  
  // States para Formulário Único
  const [cpfDigitado, setCpfDigitado] = useState('');
  const [nf, setNf] = useState('');
  const [cliente, setCliente] = useState('');
  const [cidade, setCidade] = useState('');

  // States para Formulário em Lote
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchNfs, setBatchNfs] = useState(''); // Ex: 1234, 5678, 9012

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // States para o Modal de Fotos
  const [selectedEntrega, setSelectedEntrega] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    fetchData();

    // Supabase Realtime para ouvir entregas sendo feitas na rua!
    const channel = supabase.channel('admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, payload => {
        // Atualiza a tabela chamando fetchData novamente (simplificado)
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchData() {
    // Busca motoristas
    const { data: drivers } = await supabase.from('profiles').select('*');
    if (drivers) setMotoristas(drivers);

    // Busca as últimas 50 entregas para a tabela
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select('*, profiles(name, cpf)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (deliveries) setEntregas(deliveries);
  }

  const formatCPF = (text: string) => {
    let v = text.replace(/\D/g, "");
    if (v.length <= 11) {
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    setCpfDigitado(v);
  };

  const handleCreate = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const cpfLimpo = cpfDigitado.replace(/\D/g, '');
    const driver = motoristas.find(m => m.cpf === cpfLimpo);

    if (!driver) {
      setErrorMsg('Motorista não encontrado pelo CPF informado.');
      setLoading(false);
      return;
    }

    if (isBatchMode) {
      // MODO EM LOTE
      if (!batchNfs.trim() || !cliente || !cidade) {
        setErrorMsg('Preencha as NFs, o Cliente e a Cidade destino.');
        setLoading(false);
        return;
      }

      // Separa as notas por vírgula, espaço ou quebra de linha
      const nfsArray = batchNfs.split(/[\n, ]+/).filter(n => n.trim() !== '');
      
      const insertData = nfsArray.map(numeroNF => ({
        driver_id: driver.id,
        invoice_number: numeroNF,
        client_name: cliente,
        city: cidade,
        receiver_name: '',
        receiver_cpf: '',
        receiver_relationship: '',
        status: 'pendente'
      }));

      const { error } = await supabase.from('deliveries').insert(insertData);
      
      if (error) {
        setErrorMsg(`Erro ao criar lote: ${error.message}`);
      } else {
        setSuccessMsg(`✅ Lote de ${insertData.length} entregas criadas com sucesso!`);
        setBatchNfs('');
      }

    } else {
      // MODO ÚNICO
      if (!nf || !cliente || !cidade) {
        setErrorMsg('Preencha todos os campos!');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('deliveries').insert({
        driver_id: driver.id,
        invoice_number: nf,
        client_name: cliente,
        city: cidade,
        receiver_name: '',
        receiver_cpf: '',
        receiver_relationship: '',
        status: 'pendente'
      });

      if (error) {
        setErrorMsg(`Erro do Banco: ${error.message}`);
      } else {
        setSuccessMsg('✅ Entrega enviada para o aplicativo do motorista!');
        setNf('');
      }
    }

    setLoading(false);
    fetchData(); // Atualiza a tabela
  };

  return (
    <View style={styles.container}>
      {/* SIDEBAR */}
      <View style={styles.sidebar}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>MP</Text>
          <Text style={styles.logoSubText}>ADMIN</Text>
        </View>
        <TouchableOpacity style={styles.navItemActive}>
          <MaterialCommunityIcons name="view-dashboard" size={24} color="#111" />
          <Text style={styles.navTextActive}>Controle de Entregas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="account-group" size={24} color="#FFF" />
          <Text style={styles.navText}>Motoristas</Text>
        </TouchableOpacity>
      </View>

      {/* MAIN CONTENT */}
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Dashboard Operacional</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{session ? '🟢 Sistema Conectado' : '🔴 Sem Sessão'}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
          
          {/* CARDS SUPERIORES */}
          <View style={styles.cardsRow}>
            {/* FORMULÁRIO DE CRIAÇÃO */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Despachar Entregas</Text>
                <View style={styles.toggleContainer}>
                  <TouchableOpacity 
                    style={[styles.toggleBtn, !isBatchMode && styles.toggleActive]}
                    onPress={() => setIsBatchMode(false)}
                  >
                    <Text style={[styles.toggleText, !isBatchMode && styles.toggleTextActive]}>Única</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.toggleBtn, isBatchMode && styles.toggleActive]}
                    onPress={() => setIsBatchMode(true)}
                  >
                    <Text style={[styles.toggleText, isBatchMode && styles.toggleTextActive]}>Em Massa (Lote)</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {errorMsg ? <Text style={styles.errorBox}>{errorMsg}</Text> : null}
              {successMsg ? <Text style={styles.successBox}>{successMsg}</Text> : null}

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>CPF do Motorista *</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="123.456.789-00" 
                    value={cpfDigitado} 
                    onChangeText={formatCPF}
                  />
                  {motoristas.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.driverScroll}>
                      {motoristas.map(m => (
                        <TouchableOpacity key={m.id} style={styles.chip} onPress={() => formatCPF(m.cpf || '')}>
                          <Text style={styles.chipText}>{m.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Cliente Destino *</Text>
                  <TextInput style={styles.input} placeholder="Ex: Mercado Atacadão" value={cliente} onChangeText={setCliente} />
                </View>
                
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Cidade *</Text>
                  <TextInput style={styles.input} placeholder="Ex: São Paulo" value={cidade} onChangeText={setCidade} />
                </View>
              </View>

              {isBatchMode ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.label}>Lista de Notas Fiscais (Cole aqui) *</Text>
                  <TextInput 
                    style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
                    placeholder="Ex: 3521, 3522, 3523" 
                    value={batchNfs} 
                    onChangeText={setBatchNfs}
                    multiline
                  />
                  <Text style={styles.hint}>Separe as NFs por vírgula, espaço ou pulando linha.</Text>
                </View>
              ) : (
                <View style={{ marginTop: 16, width: '32%' }}>
                  <Text style={styles.label}>Número da NF *</Text>
                  <TextInput style={styles.input} placeholder="Ex: 352514" value={nf} onChangeText={setNf} />
                </View>
              )}

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={loading}>
                {loading ? <ActivityIndicator color="#111" /> : <Text style={styles.submitBtnText}>Criar {isBatchMode ? 'Lote de Entregas' : 'Entrega'}</Text>}
              </TouchableOpacity>
            </View>
          </View>

          {/* TABELA DE ACOMPANHAMENTO */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Últimas Entregas</Text>
            
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 0.5 }]}>NF</Text>
              <Text style={[styles.th, { flex: 1 }]}>Motorista</Text>
              <Text style={[styles.th, { flex: 1 }]}>Cliente / Cidade</Text>
              <Text style={[styles.th, { flex: 0.8 }]}>Status</Text>
              <Text style={[styles.th, { flex: 0.5, textAlign: 'center' }]}>Ações</Text>
            </View>

            {entregas.map((e, index) => (
              <View key={e.id} style={[styles.tr, index % 2 === 0 && styles.trEven]}>
                <Text style={[styles.td, { flex: 0.5, fontWeight: 'bold' }]}>{e.invoice_number}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{e.profiles?.name || 'Desconhecido'}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{e.client_name} - {e.city}</Text>
                
                <View style={[styles.td, { flex: 0.8 }]}>
                  {e.status === 'pendente' ? (
                    <View style={styles.badgePendente}><Text style={styles.badgePendenteText}>🔴 Na Rua</Text></View>
                  ) : (
                    <View style={styles.badgeEnviada}><Text style={styles.badgeEnviadaText}>🟢 Finalizada</Text></View>
                  )}
                </View>

                <View style={[styles.td, { flex: 0.5, alignItems: 'center' }]}>
                  {e.status === 'enviada' && (
                    <TouchableOpacity style={styles.viewPhotosBtn} onPress={() => setSelectedEntrega(e)}>
                      <MaterialCommunityIcons name="image-multiple" size={18} color="#111" />
                      <Text style={styles.viewPhotosText}>Ver Fotos</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* MODAL DE FOTOS */}
      {selectedEntrega && (
        <Modal transparent visible animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Comprovantes - NF {selectedEntrega.invoice_number}</Text>
                <TouchableOpacity onPress={() => setSelectedEntrega(null)}>
                  <MaterialCommunityIcons name="close" size={28} color="#333" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalSubtitle}>
                Recebedor: {selectedEntrega.receiver_name} (CPF: {selectedEntrega.receiver_cpf} - {selectedEntrega.receiver_relationship})
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosScroll}>
                <View style={styles.photoBox}>
                  <Text style={styles.photoLabel}>Etiqueta</Text>
                  {selectedEntrega.label_photo_url ? (
                    <Image source={{ uri: selectedEntrega.label_photo_url }} style={styles.photoImage} />
                  ) : <View style={styles.photoPlaceholder}><Text>Sem foto</Text></View>}
                </View>
                <View style={styles.photoBox}>
                  <Text style={styles.photoLabel}>Nota Fiscal</Text>
                  {selectedEntrega.invoice_photo_url ? (
                    <Image source={{ uri: selectedEntrega.invoice_photo_url }} style={styles.photoImage} />
                  ) : <View style={styles.photoPlaceholder}><Text>Sem foto</Text></View>}
                </View>
                <View style={styles.photoBox}>
                  <Text style={styles.photoLabel}>Produto</Text>
                  {selectedEntrega.product_photo_url ? (
                    <Image source={{ uri: selectedEntrega.product_photo_url }} style={styles.photoImage} />
                  ) : <View style={styles.photoPlaceholder}><Text>Sem foto</Text></View>}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F0F2F5' },
  sidebar: { width: 250, backgroundColor: '#111111', padding: 24 },
  logoContainer: { marginBottom: 48 },
  logoText: { fontSize: 32, fontWeight: '900', color: '#FFD100', fontStyle: 'italic' },
  logoSubText: { fontSize: 14, color: '#FFF', fontWeight: 'bold' },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, gap: 12 },
  navItemActive: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#FFD100', gap: 12, marginBottom: 8 },
  navText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  navTextActive: { color: '#111', fontSize: 16, fontWeight: 'bold' },
  
  mainContent: { flex: 1 },
  header: { backgroundColor: '#FFF', paddingHorizontal: 32, paddingVertical: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  statusBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#555' },

  cardsRow: { flexDirection: 'row', gap: 24 },
  card: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 8, padding: 4 },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  toggleActive: { backgroundColor: '#FFD100' },
  toggleText: { color: '#666', fontWeight: '600', fontSize: 14 },
  toggleTextActive: { color: '#111', fontWeight: 'bold' },

  formRow: { flexDirection: 'row', gap: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 8, padding: 12, fontSize: 14, color: '#111' },
  hint: { fontSize: 12, color: '#888', marginTop: 4 },
  
  driverScroll: { marginTop: 8, flexDirection: 'row' },
  chip: { backgroundColor: '#F0F0F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
  chipText: { fontSize: 12, color: '#333', fontWeight: '600' },

  submitBtn: { backgroundColor: '#111', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: '#FFD100', fontSize: 16, fontWeight: 'bold' },

  errorBox: { backgroundColor: '#FFEBEB', color: '#D32F2F', padding: 16, borderRadius: 8, marginBottom: 16, fontWeight: 'bold' },
  successBox: { backgroundColor: '#E8F5E9', color: '#2E7D32', padding: 16, borderRadius: 8, marginBottom: 16, fontWeight: 'bold' },

  // TABELA
  tableHeader: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#E5E5E5', paddingBottom: 12, marginBottom: 8 },
  th: { fontSize: 12, fontWeight: 'bold', color: '#888', textTransform: 'uppercase' },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  trEven: { backgroundColor: '#FAFAFA' },
  td: { fontSize: 14, color: '#333' },
  
  badgePendente: { backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  badgePendenteText: { color: '#E65100', fontSize: 12, fontWeight: 'bold' },
  badgeEnviada: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  badgeEnviadaText: { color: '#2E7D32', fontSize: 12, fontWeight: 'bold' },
  
  viewPhotosBtn: { flexDirection: 'row', backgroundColor: '#FFD100', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, alignItems: 'center', gap: 6 },
  viewPhotosText: { fontSize: 12, fontWeight: 'bold', color: '#111' },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 40 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 32, width: '100%', maxWidth: 1000, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  modalSubtitle: { fontSize: 16, color: '#666', marginBottom: 24 },
  photosScroll: { gap: 16 },
  photoBox: { gap: 8 },
  photoLabel: { fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  photoImage: { width: 300, height: 400, borderRadius: 12, resizeMode: 'cover', backgroundColor: '#000' },
  photoPlaceholder: { width: 300, height: 400, borderRadius: 12, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' }
});
