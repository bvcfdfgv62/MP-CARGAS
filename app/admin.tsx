import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, ActivityIndicator, Image, Alert, SafeAreaView, Dimensions, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../src/services/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseSecundario = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export default function AdminDashboardMobile() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'entregas' | 'motoristas'>('entregas');
  
  const [session, setSession] = useState<any>(null);
  const [motoristas, setMotoristas] = useState<any[]>([]);
  const [entregas, setEntregas] = useState<any[]>([]);
  
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showDriverForm, setShowDriverForm] = useState(false);

  const [cpfDigitado, setCpfDigitado] = useState('');
  const [nf, setNf] = useState('');
  const [cliente, setCliente] = useState('');
  const [cidade, setCidade] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchNfs, setBatchNfs] = useState('');

  const [novoMotNome, setNovoMotNome] = useState('');
  const [novoMotCpf, setNovoMotCpf] = useState('');
  const [novoMotSenha, setNovoMotSenha] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [selectedEntrega, setSelectedEntrega] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    fetchData();

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
    setErrorMsg('');
    setSuccessMsg('');
    
    const deleteAction = async () => {
      setLoading(true);
      try {
        const { error } = await supabase.from('deliveries').delete().eq('id', id);
        setLoading(false);
        if (error) {
          setErrorMsg(`Falha ao excluir: ${error.message}`);
        } else {
          setSuccessMsg('Entrega excluída com sucesso!');
          fetchData();
        }
      } catch (err: any) {
        setLoading(false);
        setErrorMsg(`Erro interno: ${err.message}`);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm && window.confirm('Tem certeza que deseja apagar esta entrega?')) {
        deleteAction();
      }
    } else {
      Alert.alert(
        'Confirmar Exclusão',
        'Tem certeza que deseja apagar esta entrega?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Apagar', style: 'destructive', onPress: deleteAction }
        ]
      );
    }
  };

  const handleDeleteDriver = async (id: string) => {
    setErrorMsg(''); setSuccessMsg('');
    const deleteAction = async () => {
      setLoading(true);
      try {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        setLoading(false);
        if (error) setErrorMsg(`Falha ao excluir motorista: ${error.message}`);
        else { setSuccessMsg('Motorista excluído com sucesso!'); fetchData(); }
      } catch (err: any) {
        setLoading(false);
        setErrorMsg(`Erro interno: ${err.message}`);
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm && window.confirm('Tem certeza que deseja EXCLUIR este motorista?')) deleteAction();
    } else {
      Alert.alert('Confirmar Exclusão', 'Apagar motorista?', [{text: 'Cancelar', style: 'cancel'}, {text: 'Apagar', style: 'destructive', onPress: deleteAction}]);
    }
  };

  const handleAdminLogout = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Deseja sair do painel administrador?')) {
        await supabase.auth.signOut();
        router.replace('/(auth)/login');
      }
    } else {
      Alert.alert('Sair', 'Deseja sair do painel administrador?', [
        {text: 'Cancelar', style: 'cancel'},
        {text: 'Sair', style: 'destructive', onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        }}
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER - Largura total, mas com conteúdo centralizado */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerLogo}>MP <Text style={{fontWeight: '300', color: '#333'}}>ADMIN</Text></Text>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 16}}>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: session ? '#4CAF50' : '#F44336' }]} />
              <Text style={styles.headerStatus}>{session ? 'Online' : 'Offline'}</Text>
            </View>
            <TouchableOpacity onPress={handleAdminLogout} style={{backgroundColor: '#111', padding: 8, borderRadius: 8}}>
              <MaterialCommunityIcons name="logout" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* TABS - Largura total */}
      <View style={styles.tabsContainerWrapper}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'entregas' && styles.tabActive]} onPress={() => {setActiveTab('entregas'); setErrorMsg(''); setSuccessMsg('');}}>
            <MaterialCommunityIcons name="truck-delivery" size={22} color={activeTab === 'entregas' ? '#111' : '#888'} />
            <Text style={[styles.tabText, activeTab === 'entregas' && styles.tabTextActive]}>Entregas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'motoristas' && styles.tabActive]} onPress={() => {setActiveTab('motoristas'); setErrorMsg(''); setSuccessMsg('');}}>
            <MaterialCommunityIcons name="account-group" size={22} color={activeTab === 'motoristas' ? '#111' : '#888'} />
            <Text style={[styles.tabText, activeTab === 'motoristas' && styles.tabTextActive]}>Motoristas</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTEÚDO PRINCIPAL (Centralizado e limitado a 800px no Desktop) */}
      <ScrollView contentContainerStyle={styles.scrollContentWrapper} showsVerticalScrollIndicator={false}>
        <View style={styles.innerContent}>

          {errorMsg ? <View style={styles.errorBox}><MaterialCommunityIcons name="alert-circle" size={20} color="#D32F2F" /><Text style={styles.errorText}>{errorMsg}</Text></View> : null}
          {successMsg ? <View style={styles.successBox}><MaterialCommunityIcons name="check-circle" size={20} color="#2E7D32" /><Text style={styles.successText}>{successMsg}</Text></View> : null}

          {/* ABA ENTREGAS */}
          {activeTab === 'entregas' && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Controle de Entregas</Text>
                <TouchableOpacity style={styles.actionButton} onPress={() => setShowDeliveryForm(!showDeliveryForm)}>
                  <MaterialCommunityIcons name={showDeliveryForm ? "close" : "plus"} size={20} color="#111" />
                  <Text style={styles.actionButtonText}>{showDeliveryForm ? "Cancelar" : "Nova Entrega"}</Text>
                </TouchableOpacity>
              </View>

              {/* FORMULÁRIO DE ENTREGA */}
              {showDeliveryForm && (
                <View style={styles.formCard}>
                  <View style={styles.toggleContainer}>
                    <TouchableOpacity style={[styles.toggleBtn, !isBatchMode && styles.toggleActive]} onPress={() => setIsBatchMode(false)}>
                      <Text style={[styles.toggleText, !isBatchMode && styles.toggleTextActive]}>Única</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.toggleBtn, isBatchMode && styles.toggleActive]} onPress={() => setIsBatchMode(true)}>
                      <Text style={[styles.toggleText, isBatchMode && styles.toggleTextActive]}>Múltiplas (Lote)</Text>
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

                  <View style={styles.rowInputs}>
                    <View style={{flex: 1}}>
                      <Text style={styles.label}>Cliente Destino *</Text>
                      <TextInput style={styles.input} placeholder="Ex: Mercado Atacadão" value={cliente} onChangeText={setCliente} />
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={styles.label}>Cidade *</Text>
                      <TextInput style={styles.input} placeholder="Ex: São Paulo" value={cidade} onChangeText={setCidade} />
                    </View>
                  </View>

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
                    {loading ? <ActivityIndicator color="#111" /> : <Text style={styles.submitBtnText}>Confirmar Lançamento</Text>}
                  </TouchableOpacity>
                </View>
              )}

              {/* LISTA DE ENTREGAS (CARDS RESPONSIVOS) */}
              <View style={styles.cardsGrid}>
                {entregas.map(e => (
                  <View key={e.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MaterialCommunityIcons name="file-document-outline" size={20} color="#666" />
                        <Text style={styles.cardTitle}>NF {e.invoice_number}</Text>
                      </View>
                      {e.status === 'pendente' ? (
                        <View style={styles.badgePendente}><Text style={styles.badgePendenteText}>Na Rua</Text></View>
                      ) : (
                        <View style={styles.badgeEnviada}><Text style={styles.badgeEnviadaText}>Finalizada</Text></View>
                      )}
                    </View>
                    
                    <View style={styles.cardBody}>
                      <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="account-hard-hat" size={16} color="#888" />
                        <Text style={styles.cardText}>{e.profiles?.name || 'Desconhecido'}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="map-marker" size={16} color="#888" />
                        <Text style={styles.cardText}>{e.client_name} - {e.city}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.cardActions}>
                      {e.status === 'enviada' ? (
                        <TouchableOpacity style={styles.btnVerFotos} onPress={() => setSelectedEntrega(e)}>
                          <MaterialCommunityIcons name="image-multiple" size={16} color="#FFF" />
                          <Text style={styles.btnVerFotosText}>Ver Comprovantes</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={{flex: 1}} />
                      )}
                      <TouchableOpacity style={styles.btnExcluir} onPress={() => handleDeleteDelivery(e.id)}>
                        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#D32F2F" />
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
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Equipe de Campo</Text>
                <TouchableOpacity style={styles.actionButton} onPress={() => setShowDriverForm(!showDriverForm)}>
                  <MaterialCommunityIcons name={showDriverForm ? "close" : "account-plus"} size={20} color="#111" />
                  <Text style={styles.actionButtonText}>{showDriverForm ? "Cancelar" : "Cadastrar"}</Text>
                </TouchableOpacity>
              </View>

              {/* FORMULÁRIO DE MOTORISTA */}
              {showDriverForm && (
                <View style={styles.formCard}>
                  <Text style={styles.label}>Nome Completo *</Text>
                  <TextInput style={styles.input} placeholder="Ex: João Silva" value={novoMotNome} onChangeText={setNovoMotNome} />
                  
                  <View style={styles.rowInputs}>
                    <View style={{flex: 1}}>
                      <Text style={styles.label}>CPF *</Text>
                      <TextInput style={styles.input} placeholder="123.456.789-00" value={novoMotCpf} onChangeText={formatCPFMotorista} keyboardType="numeric" maxLength={14} />
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={styles.label}>Senha de Acesso *</Text>
                      <TextInput style={styles.input} placeholder="Ex: 123456" value={novoMotSenha} onChangeText={setNovoMotSenha} secureTextEntry />
                    </View>
                  </View>

                  <TouchableOpacity style={styles.submitBtn} onPress={handleCreateDriver} disabled={loading}>
                    {loading ? <ActivityIndicator color="#111" /> : <Text style={styles.submitBtnText}>Salvar Motorista</Text>}
                  </TouchableOpacity>
                </View>
              )}

              {/* LISTA DE MOTORISTAS */}
              <View style={styles.cardsGrid}>
                {motoristas.map(m => (
                  <View key={m.id} style={styles.driverCard}>
                    <View style={styles.driverAvatar}>
                      <MaterialCommunityIcons name="account" size={28} color="#FFD100" />
                    </View>
                    <View style={styles.driverInfo}>
                      <Text style={styles.driverName}>{m.name}</Text>
                      <Text style={styles.driverCpf}>CPF: {m.cpf}</Text>
                    </View>
                    <TouchableOpacity style={styles.btnExcluir} onPress={() => handleDeleteDriver(m.id)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={20} color="#D32F2F" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      {/* MODAL DE FOTOS (Mantido com melhorias de UI) */}
      {selectedEntrega && (
        <Modal transparent visible animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>NF {selectedEntrega.invoice_number}</Text>
                  <Text style={styles.modalSubtitle}>Recebedor: {selectedEntrega.receiver_name} ({selectedEntrega.receiver_cpf})</Text>
                </View>
                <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedEntrega(null)}>
                  <MaterialCommunityIcons name="close" size={24} color="#111" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.photosScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.photoBox}>
                  <Text style={styles.photoLabel}>Etiqueta</Text>
                  {selectedEntrega.label_photo_url ? (
                    <Image source={{ uri: selectedEntrega.label_photo_url }} style={styles.photoImage} />
                  ) : <View style={styles.emptyPhoto}><Text>Sem foto</Text></View>}
                </View>
                <View style={styles.photoBox}>
                  <Text style={styles.photoLabel}>Nota Fiscal</Text>
                  {selectedEntrega.invoice_photo_url ? (
                    <Image source={{ uri: selectedEntrega.invoice_photo_url }} style={styles.photoImage} />
                  ) : <View style={styles.emptyPhoto}><Text>Sem foto</Text></View>}
                </View>
                <View style={styles.photoBox}>
                  <Text style={styles.photoLabel}>Produto</Text>
                  {selectedEntrega.product_photo_url ? (
                    <Image source={{ uri: selectedEntrega.product_photo_url }} style={styles.photoImage} />
                  ) : <View style={styles.emptyPhoto}><Text>Sem foto</Text></View>}
                </View>
                <View style={{height: 60}} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  
  // Header
  header: { backgroundColor: '#FFD100', width: '100%', paddingTop: Platform.OS === 'ios' ? 40 : 20 },
  headerContent: { maxWidth: 800, width: '100%', alignSelf: 'center', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLogo: { fontSize: 28, fontWeight: '900', color: '#111', fontStyle: 'italic', letterSpacing: -1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  headerStatus: { fontSize: 13, fontWeight: 'bold', color: '#111' },
  
  // Tabs
  tabsContainerWrapper: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, zIndex: 10 },
  tabsContainer: { maxWidth: 800, width: '100%', alignSelf: 'center', flexDirection: 'row' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 8, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#FFD100' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#111', fontWeight: 'bold' },

  // Scroll Content
  scrollContentWrapper: { paddingVertical: 24, paddingHorizontal: 16, alignItems: 'center' },
  innerContent: { width: '100%', maxWidth: 800 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#111', letterSpacing: -0.5 },
  
  actionButton: { backgroundColor: '#FFD100', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, gap: 6 },
  actionButtonText: { fontSize: 14, fontWeight: 'bold', color: '#111' },

  // Form
  formCard: { backgroundColor: '#FFF', padding: 24, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#EEE', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 10, padding: 4, marginBottom: 20 },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  toggleActive: { backgroundColor: '#FFD100', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  toggleText: { color: '#666', fontWeight: '600', fontSize: 14 },
  toggleTextActive: { color: '#111', fontWeight: 'bold' },
  
  rowInputs: { flexDirection: 'row', gap: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 10, padding: 14, fontSize: 15, color: '#111' },
  
  chipScroll: { marginTop: 12, flexDirection: 'row', maxHeight: 40 },
  chip: { backgroundColor: '#F0F0F0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#E5E5E5' },
  chipText: { fontSize: 13, color: '#333', fontWeight: 'bold' },

  submitBtn: { backgroundColor: '#111', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  submitBtnText: { color: '#FFD100', fontSize: 16, fontWeight: 'bold' },

  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 16, borderRadius: 10, marginBottom: 20, gap: 8, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: '#B91C1C', fontWeight: '600', fontSize: 14 },
  successBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 16, borderRadius: 10, marginBottom: 20, gap: 8, borderWidth: 1, borderColor: '#BBF7D0' },
  successText: { color: '#15803D', fontWeight: '600', fontSize: 14 },

  // Grid/Cards
  cardsGrid: { gap: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#EEE', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  
  cardBody: { gap: 8, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardText: { fontSize: 15, color: '#555', fontWeight: '500' },
  
  badgePendente: { backgroundColor: '#FFF7ED', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FFEDD5' },
  badgePendenteText: { color: '#C2410C', fontSize: 12, fontWeight: 'bold' },
  badgeEnviada: { backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0' },
  badgeEnviadaText: { color: '#15803D', fontSize: 12, fontWeight: 'bold' },

  cardActions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  btnVerFotos: { flex: 1, backgroundColor: '#111', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 10, gap: 8 },
  btnVerFotosText: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
  btnExcluir: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FECACA' },

  // Driver Cards
  driverCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EEE', gap: 16 },
  driverAvatar: { width: 56, height: 56, backgroundColor: '#111', borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 17, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  driverCpf: { fontSize: 14, color: '#666' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, width: '100%', maxWidth: 600, height: '90%', shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  modalSubtitle: { fontSize: 15, color: '#666' },
  closeModalBtn: { backgroundColor: '#F5F5F5', padding: 8, borderRadius: 20 },
  
  photosScroll: { flex: 1 },
  photoBox: { marginBottom: 32 },
  photoLabel: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 12, letterSpacing: -0.5 },
  photoImage: { width: '100%', height: 400, borderRadius: 16, resizeMode: 'cover', backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#EEE' },
  emptyPhoto: { width: '100%', height: 300, borderRadius: 16, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' }
});
