import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

const RELATIONSHIPS = ['Titular', 'Funcionário', 'Porteiro', 'Familiar', 'Vizinho', 'Outro'];

export default function ReceiverScreen() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [parentesco, setParentesco] = useState('');

  const formatCPF = (text: string) => {
    // Máscara simples de CPF
    let v = text.replace(/\D/g, "");
    if (v.length <= 11) {
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    setCpf(v);
  };

  const handleConfirm = () => {
    // Salvar no Zustand
    router.push('/(app)/delivery-flow/summary');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Nome do Recebedor *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: João da Silva"
        placeholderTextColor="#888"
        value={nome}
        onChangeText={setNome}
      />

      <Text style={styles.label}>CPF *</Text>
      <TextInput
        style={styles.input}
        placeholder="000.000.000-00"
        placeholderTextColor="#888"
        keyboardType="numeric"
        value={cpf}
        onChangeText={formatCPF}
        maxLength={14}
      />

      <Text style={styles.label}>Parentesco *</Text>
      <View style={styles.grid}>
        {RELATIONSHIPS.map((rel) => (
          <TouchableOpacity
            key={rel}
            style={[styles.card, parentesco === rel && styles.cardActive]}
            onPress={() => setParentesco(rel)}>
            <Text style={[styles.cardText, parentesco === rel && styles.cardTextActive]}>
              {rel}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        style={[styles.button, (!nome || cpf.length !== 14 || !parentesco) && styles.buttonDisabled]} 
        disabled={!nome || cpf.length !== 14 || !parentesco}
        onPress={handleConfirm}>
        <Text style={styles.buttonText}>CONFIRMAR</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  content: {
    padding: 24,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#222222',
    color: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 32,
  },
  card: {
    width: '48%',
    backgroundColor: '#222222',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  cardActive: {
    backgroundColor: '#FFD100',
    borderColor: '#FFD100',
  },
  cardText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cardTextActive: {
    color: '#111111',
  },
  button: {
    backgroundColor: '#FFD100',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#444444',
  },
  buttonText: {
    color: '#111111',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
