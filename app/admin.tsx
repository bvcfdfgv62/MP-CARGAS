import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, ActivityIndicator, Image, Alert, SafeAreaView } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../src/services/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Um cliente secundário para podermos cadastrar motoristas sem deslogar o Admin
import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseSecundario = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export default function AdminDashboardMobile() {
  const [activeTab, setActiveTab] = useState<'entregas' | 'motoristas'>('entregas');
  
  const [session, setSession] = useState<any>(null);
  const [motoristas, setMotoristas] = useState<any[]>([]);
  const [entregas, setEntregas] = useState<any[]>([]);
  
  // Controle de Formulários (Expansível)
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showDriverForm, setShowDriverForm] = useState(false);

  // States para Formulário de Entrega
  const [cpfDigitado, setCpfDigitado] = useState('');
  const [nf, setNf] = useState('');
  const [cliente, setCliente] = useState('');
  const [cidade, setCidade] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchNfs, setBatchNfs] = useState('');

  // States para Formulário de Motorista
  const [novoMotNome, setNovoMotNome] = useState('');
  const [novoMotCpf, setNovoMotCpf] = useState('');
  const [novoMotSenha, setNovoMotSenha] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // States para o Modal de Fotos
  const [selectedEntrega, setSelectedEntrega] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    fetchData();

    // Supabase Realtime
    const channel = supabase.channel('admin_realtime_mobile')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, payload => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchData() {
    const { data: drivers } = await supabase.from('profiles').select('*');
    if (drivers) setMotoristas(drivers);

    const { data: deliveries } = await supabase
      .from('deliveries')
      .select('*, profiles(name, cpf)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (deliveries) setEntregas(deliveries);
  }

  // ===============================
  // FUNÇÕES DE MOTORISTAS
  // ===============================
  const formatCPFMotorista = (text: string) => {
    let v = text.replace(/\D/g, "");
    if (v.length <= 11) {
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    setNovoMotCpf(v);
  };

  const handleCreateDriver = async () => {
    setErrorMsg(''); setSuccessMsg(''); setLoading(true);
    const cpfLimpo = novoMotCpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11 || !novoMotNome || !novoMotSenha) {
      setErrorMsg('Preencha nome, CPF completo e senha.');
      setLoading(false); return;
    }

    const email = `${cpfLimpo}@mpcargas.com`;
    const { error } = await supabaseSecundario.auth.signUp({
      email,
      password: novoMotSenha,
      options: { data: { cpf: cpfLimpo, name: novoMotNome } }
    });

    setLoading(false);
    if (error) {
      setErrorMsg(`Erro: ${error.message}`);
    } else {
      setSuccessMsg('Motorista criado com sucesso!');
      setNovoMotNome(''); setNovoMotCpf(''); setNovoMotSenha('');
      setShowDriverForm(false);
      fetchData();
    }
  };

  // ===============================
  // FUNÇÕES DE ENTREGAS
  // ===============================
  const formatCPFEntrega = (text: string) => {
    let v = text.replace(/\D/g, "");
    if (v.length <= 11) {
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    setCpfDigitado(v);
  };

  const handleCreateDelivery = async () => {
    setErrorMsg(''); setSuccessMsg(''); setLoading(true);
    const cpfLimpo = cpfDigitado.replace(/\D/g, '');
    const driver = motoristas.find(m => m.cpf === cpfLimpo);

    if (!driver) {
      setErrorMsg('Motorista não encontrado.'); setLoading(false); return;
    }

    if (isBatchMode) {
      if (!batchNfs.trim() || !cliente || !cidade) {
        setErrorMsg('Preencha NFs, Cliente e Cidade.'); setLoading(false); return;
      }
      const nfsArray = batchNfs.split(/[\n, ]+/).filter(n => n.trim() !== '');
      const insertData = nfsArray.map(n => ({
        driver_id: driver.id, invoice_number: n, client_name: cliente, city: cidade,
        receiver_name: '', receiver_cpf: '', receiver_relationship: '', status: 'pendente'
      }));
      const { error } = await supabase.from('deliveries').insert(insertData);
      if (error) setErrorMsg(`Erro: ${error.message}`);
      else { setSuccessMsg(`Lote de ${insertData.length} notas criado!`); setBatchNfs(''); setShowDeliveryForm(false); }
    } else {
      if (!nf || !cliente || !cidade) {
        setErrorMsg('Preencha todos os campos!'); setLoading(false); return;
      }
      const { error } = await supabase.from('deliveries').insert({
        driver_id: driver.id, invoice_number: nf, client_name: cliente, city: cidade,
        receiver_name: '', receiver_cpf: '', receiver_relationship: '', status: 'pendente'
      });
      if (error) setErrorMsg(`Erro: ${error.message}`);
      else { setSuccessMsg('Entrega criada!'); setNf(''); setShowDeliveryForm(false); }
    }
    setLoading(false); fetchData();
  };

  const handleDeleteDelivery = async (id: string) => {
    if (window.confirm && !window.confirm('Tem certeza que deseja apagar esta entrega?')) return;
    
    setLoading(true);
    const { error } = await supabase.from('deliveries').delete().eq('id', id);
    setLoading(false);
    
    if (error) Alert.alert('Erro', error.message);
    else fetchData();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER MOBILE */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLogo}>MP<Text style={{color:'#111', fontStyle:'normal'}}>ADMIN</Text></Text>
          <Text style={styles.headerStatus}>{session ? '🟢 Conectado' : '🔴 Offline'}</Text>
        </View>
      </View>

      {/* ABAS */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'entregas' && styles.tabActive]} onPress={() => {setActiveTab('entregas'); setErrorMsg(''); setSuccessMsg('');}}>
          <MaterialCommunityIcons name="truck-delivery" size={20} color={activeTab === 'entregas' ? '#111' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'entregas' && styles.tabTextActive]}>Entregas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'motoristas' && styles.tabActive]} onPress={() => {setActiveTab('motoristas'); setErrorMsg(''); setSuccessMsg('');}}>
          <MaterialCommunityIcons name="account-group" size={20} color={activeTab === 'motoristas' ? '#111' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'motoristas' && styles.tabTextActive]}>Motoristas</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {errorMsg ? <Text style={styles.errorBox}>{errorMsg}</Text> : null}
        {successMsg ? <Text style={styles.successBox}>{successMsg}</Text> : null}

        {/* ABA ENTREGAS */}
        {activeTab === 'entregas' && (
          <View>
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowDeliveryForm(!showDeliveryForm)}>
              <MaterialCommunityIcons name={showDeliveryForm ? "close" : "plus"} size={24} color="#111" />
              <Text style={styles.actionButtonText}>{showDeliveryForm ? "Cancelar" : "Nova Entrega"}</Text>
            </TouchableOpacity>

            {/* FORMULÁRIO DE ENTREGA */}
            {showDeliveryForm && (
              <View style={styles.formCard}>
                <View style={styles.toggleContainer}>
                  <TouchableOpacity style={[styles.toggleBtn, !isBatchMode && styles.toggleActive]} onPress={() => setIsBatchMode(false)}>
                    <Text style={[styles.toggleText, !isBatchMode && styles.toggleTextActive]}>Única</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.toggleBtn, isBatchMode && styles.toggleActive]} onPress={() => setIsBatchMode(true)}>
                    <Text style={[styles.toggleText, isBatchMode && styles.toggleTextActive]}>Lote (Folha)</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>CPF do Motorista *</Text>
                <TextInput style={styles.input} placeholder="123.456.789-00" value={cpfDigitado} onChangeText={formatCPFEntrega} keyboardType="numeric" />
                
                {motoristas.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                    {motoristas.map(m => (
                      <TouchableOpacity key={m.id} style={styles.chip} onPress={() => formatCPFEntrega(m.cpf || '')}>
                        <Text style={styles.chipText}>{m.name.split(' ')[0]}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                <Text style={styles.label}>Cliente Destino *</Text>
                <TextInput style={styles.input} placeholder="Ex: Mercado Atacadão" value={cliente} onChangeText={setCliente} />

                <Text style={styles.label}>Cidade *</Text>
                <TextInput style={styles.input} placeholder="Ex: São Paulo" value={cidade} onChangeText={setCidade} />

                {isBatchMode ? (
                  <>
                    <Text style={styles.label}>NFs (Cole a lista separada por vírgula) *</Text>
                    <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Ex: 3521, 3522..." value={batchNfs} onChangeText={setBatchNfs} multiline />
                  </>
                ) : (
                  <>
                    <Text style={styles.label}>Número da NF *</Text>
                    <TextInput style={styles.input} placeholder="Ex: 352514" value={nf} onChangeText={setNf} keyboardType="numeric" />
                  </>
                )}

                <TouchableOpacity style={styles.submitBtn} onPress={handleCreateDelivery} disabled={loading}>
                  {loading ? <ActivityIndicator color="#111" /> : <Text style={styles.submitBtnText}>Criar Entrega</Text>}
                </TouchableOpacity>
              </View>
            )}

            {/* LISTA DE ENTREGAS (CARDS) */}
            <Text style={styles.sectionTitle}>Entregas Recentes</Text>
            <View style={styles.cardsList}>
              {entregas.map(e => (
                <View key={e.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>NF: {e.invoice_number}</Text>
                    {e.status === 'pendente' ? (
                      <View style={styles.badgePendente}><Text style={styles.badgePendenteText}>Na Rua</Text></View>
                    ) : (
                      <View style={styles.badgeEnviada}><Text style={styles.badgeEnviadaText}>Finalizada</Text></View>
                    )}
                  </View>
                  <Text style={styles.cardText}>🚛 {e.profiles?.name || 'Desconhecido'}</Text>
                  <Text style={styles.cardText}>🏢 {e.client_name} - {e.city}</Text>
                  
                  <View style={styles.cardActions}>
                    {e.status === 'enviada' && (
                      <TouchableOpacity style={styles.btnVerFotos} onPress={() => setSelectedEntrega(e)}>
                        <MaterialCommunityIcons name="image" size={16} color="#111" />
                        <Text style={styles.btnVerFotosText}>Fotos</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.btnExcluir} onPress={() => handleDeleteDelivery(e.id)}>
                      <MaterialCommunityIcons name="trash-can" size={16} color="#FFF" />
                      <Text style={styles.btnExcluirText}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ABA MOTORISTAS */}
        {activeTab === 'motoristas' && (
          <View>
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowDriverForm(!showDriverForm)}>
              <MaterialCommunityIcons name={showDriverForm ? "close" : "account-plus"} size={24} color="#111" />
              <Text style={styles.actionButtonText}>{showDriverForm ? "Cancelar" : "Cadastrar Motorista"}</Text>
            </TouchableOpacity>

            {/* FORMULÁRIO DE MOTORISTA */}
            {showDriverForm && (
              <View style={styles.formCard}>
                <Text style={styles.label}>Nome Completo *</Text>
                <TextInput style={styles.input} placeholder="Ex: João Silva" value={novoMotNome} onChangeText={setNovoMotNome} />
                
                <Text style={styles.label}>CPF *</Text>
                <TextInput style={styles.input} placeholder="123.456.789-00" value={novoMotCpf} onChangeText={formatCPFMotorista} keyboardType="numeric" maxLength={14} />
                
                <Text style={styles.label}>Senha de Acesso *</Text>
                <TextInput style={styles.input} placeholder="Ex: 123456" value={novoMotSenha} onChangeText={setNovoMotSenha} secureTextEntry />

                <TouchableOpacity style={styles.submitBtn} onPress={handleCreateDriver} disabled={loading}>
                  {loading ? <ActivityIndicator color="#111" /> : <Text style={styles.submitBtnText}>Criar Conta</Text>}
                </TouchableOpacity>
              </View>
            )}

            {/* LISTA DE MOTORISTAS */}
            <Text style={styles.sectionTitle}>Equipe Cadastrada</Text>
            <View style={styles.cardsList}>
              {motoristas.map(m => (
                <View key={m.id} style={styles.card}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                    <View style={styles.avatar}><MaterialCommunityIcons name="account" size={24} color="#111" /></View>
                    <View>
                      <Text style={styles.cardTitle}>{m.name}</Text>
                      <Text style={styles.cardText}>CPF: {m.cpf}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* MODAL DE FOTOS */}
      {selectedEntrega && (
        <Modal transparent visible animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>NF {selectedEntrega.invoice_number}</Text>
                <TouchableOpacity onPress={() => setSelectedEntrega(null)}>
                  <MaterialCommunityIcons name="close" size={28} color="#333" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalSubtitle}>Rec: {selectedEntrega.receiver_name} ({selectedEntrega.receiver_cpf})</Text>

              <ScrollView style={styles.photosScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.photoBox}>
                  <Text style={styles.photoLabel}>Etiqueta</Text>
                  {selectedEntrega.label_photo_url ? (
                    <Image source={{ uri: selectedEntrega.label_photo_url }} style={styles.photoImage} />
                  ) : <Text>Sem foto</Text>}
                </View>
                <View style={styles.photoBox}>
                  <Text style={styles.photoLabel}>Nota Fiscal</Text>
                  {selectedEntrega.invoice_photo_url ? (
                    <Image source={{ uri: selectedEntrega.invoice_photo_url }} style={styles.photoImage} />
                  ) : <Text>Sem foto</Text>}
                </View>
                <View style={styles.photoBox}>
                  <Text style={styles.photoLabel}>Produto</Text>
                  {selectedEntrega.product_photo_url ? (
                    <Image source={{ uri: selectedEntrega.product_photo_url }} style={styles.photoImage} />
                  ) : <Text>Sem foto</Text>}
                </View>
                <View style={{height: 40}} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: { backgroundColor: '#FFD100', padding: 24, paddingBottom: 16, paddingTop: 40 },
  headerLogo: { fontSize: 24, fontWeight: '900', color: '#111', fontStyle: 'italic' },
  headerStatus: { fontSize: 12, fontWeight: 'bold', color: '#555', marginTop: 4 },
  
  tabsContainer: { flexDirection: 'row', backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 2 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#FFD100' },
  tabText: { fontSize: 14, fontWeight: 'bold', color: '#666' },
  tabTextActive: { color: '#111' },

  scrollContent: { padding: 16, paddingBottom: 40 },

  actionButton: { backgroundColor: '#FFD100', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8, marginBottom: 16 },
  actionButtonText: { fontSize: 16, fontWeight: 'bold', color: '#111' },

  formCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 24, elevation: 2 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 8, padding: 4, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  toggleActive: { backgroundColor: '#FFD100' },
  toggleText: { color: '#666', fontWeight: '600', fontSize: 14 },
  toggleTextActive: { color: '#111', fontWeight: 'bold' },
  
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 8, padding: 14, fontSize: 14, color: '#111' },
  
  chipScroll: { marginTop: 8, flexDirection: 'row', maxHeight: 40 },
  chip: { backgroundColor: '#F0F0F0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, marginRight: 8, justifyContent: 'center' },
  chipText: { fontSize: 12, color: '#333', fontWeight: 'bold' },

  submitBtn: { backgroundColor: '#111', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: '#FFD100', fontSize: 16, fontWeight: 'bold' },

  errorBox: { backgroundColor: '#FFEBEB', color: '#D32F2F', padding: 16, borderRadius: 8, marginBottom: 16, fontWeight: 'bold' },
  successBox: { backgroundColor: '#E8F5E9', color: '#2E7D32', padding: 16, borderRadius: 8, marginBottom: 16, fontWeight: 'bold' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 12, marginTop: 8 },
  cardsList: { gap: 12 },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  cardText: { fontSize: 14, color: '#555', marginBottom: 4 },
  
  badgePendente: { backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgePendenteText: { color: '#E65100', fontSize: 12, fontWeight: 'bold' },
  badgeEnviada: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeEnviadaText: { color: '#2E7D32', fontSize: 12, fontWeight: 'bold' },

  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
  btnVerFotos: { flex: 1, backgroundColor: '#FFD100', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 10, borderRadius: 8, gap: 6 },
  btnVerFotosText: { fontSize: 12, fontWeight: 'bold', color: '#111' },
  btnExcluir: { flex: 1, backgroundColor: '#D32F2F', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 10, borderRadius: 8, gap: 6 },
  btnExcluirText: { fontSize: 12, fontWeight: 'bold', color: '#FFF' },

  avatar: { width: 48, height: 48, backgroundColor: '#F0F0F0', borderRadius: 24, justifyContent: 'center', alignItems: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, height: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  photosScroll: { flex: 1 },
  photoBox: { marginBottom: 24 },
  photoLabel: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  photoImage: { width: '100%', height: 300, borderRadius: 12, resizeMode: 'contain', backgroundColor: '#F5F5F5' },
});
