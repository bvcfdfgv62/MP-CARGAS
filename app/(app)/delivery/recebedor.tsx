import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useDeliveryStore } from '../../../src/store';

const PARENTESCOS = [
  { id: 'Titular', icon: 'account' },
  { id: 'Funcionário', icon: 'badge-account' },
  { id: 'Porteiro', icon: 'door' },
  { id: 'Familiar', icon: 'account-group' },
  { id: 'Vizinho', icon: 'home-city' },
  { id: 'Outro', icon: 'dots-horizontal' },
];

export default function RecebedorScreen() {
  const router = useRouter();
  const setRecebedor = useDeliveryStore(state => state.setRecebedor);
  
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [parentesco, setParentesco] = useState('Titular');

  const formatCPF = (text: string) => {
    let v = text.replace(/\D/g, "");
    if (v.length <= 11) {
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    setCpf(v);
  };

  const isValid = nome.length > 2 && cpf.length === 14;

  const handleNext = () => {
    if (!isValid) return;
    setRecebedor(nome, cpf, parentesco);
    router.push('/(app)/delivery/resumo');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.label}>Nome do Recebedor <Text style={styles.asterisk}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: João da Silva"
          placeholderTextColor="#666"
          value={nome}
          onChangeText={setNome}
        />

        <Text style={styles.label}>CPF <Text style={styles.asterisk}>*</Text></Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.inputCpf}
            placeholder="000.000.000-00"
            placeholderTextColor="#666"
            value={cpf}
            onChangeText={formatCPF}
            keyboardType="numeric"
            maxLength={14}
          />
          {cpf.length === 14 && <MaterialCommunityIcons name="check-circle-outline" size={24} color="#4CAF50" />}
        </View>

        <Text style={styles.label}>Parentesco <Text style={styles.asterisk}>*</Text></Text>
        <View style={styles.grid}>
          {PARENTESCOS.map((item) => {
            const isSelected = parentesco === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.gridCard, isSelected && styles.gridCardSelected]}
                onPress={() => setParentesco(item.id)}
              >
                <MaterialCommunityIcons 
                  name={item.icon as any} 
                  size={32} 
                  color={isSelected ? '#111' : '#888'} 
                />
                <Text style={[styles.gridText, isSelected && styles.gridTextSelected]}>{item.id}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.btnPrimary, !isValid && styles.btnDisabled]} 
          onPress={handleNext}
          disabled={!isValid}
        >
          <Text style={styles.btnPrimaryText}>CONFIRMAR</Text>
          <MaterialCommunityIcons name="arrow-right" size={24} color="#111" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  scroll: { padding: 24 },
  label: { color: '#FFD100', fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginTop: 16 },
  asterisk: { color: '#E53935' },
  input: {
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputCpf: { flex: 1, paddingVertical: 16, color: '#FFF', fontSize: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8 },
  gridCard: {
    width: '48%',
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  gridCardSelected: {
    backgroundColor: '#FFD100',
    borderColor: '#FFD100',
  },
  gridText: { color: '#888', marginTop: 8, fontSize: 14, fontWeight: 'bold' },
  gridTextSelected: { color: '#111' },
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
  btnDisabled: { opacity: 0.5 },
  btnPrimaryText: { color: '#111', fontWeight: 'bold', fontSize: 16 },
});
