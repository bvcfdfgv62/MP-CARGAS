import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function SummaryScreen() {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);

  const handleSend = () => {
    setIsSending(true);
    // Simula o processo de envio e salvamento local
    setTimeout(() => {
      setIsSending(false);
      // Redireciona para o início com alerta de sucesso (ou tela de sucesso)
      router.replace('/(app)');
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dados da Nota</Text>
        <Text style={styles.info}><Text style={styles.bold}>NF:</Text> 35251487</Text>
        <Text style={styles.info}><Text style={styles.bold}>Cliente:</Text> CLIENTE ABC LTDA</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recebedor</Text>
        <Text style={styles.info}><Text style={styles.bold}>Nome:</Text> João da Silva</Text>
        <Text style={styles.info}><Text style={styles.bold}>CPF:</Text> 123.456.789-10</Text>
        <Text style={styles.info}><Text style={styles.bold}>Parentesco:</Text> Funcionário</Text>
      </View>

      <View style={styles.photosGrid}>
        <View style={styles.photoBox}>
          <Text style={styles.photoLabel}>Etiqueta</Text>
          <View style={styles.photoDummy} />
        </View>
        <View style={styles.photoBox}>
          <Text style={styles.photoLabel}>Nota</Text>
          <View style={styles.photoDummy} />
        </View>
        <View style={styles.photoBox}>
          <Text style={styles.photoLabel}>Produto</Text>
          <View style={styles.photoDummy} />
        </View>
      </View>

      <View style={{ flex: 1 }} />

      <TouchableOpacity 
        style={[styles.button, isSending && styles.buttonDisabled]} 
        disabled={isSending}
        onPress={handleSend}>
        {isSending ? (
          <ActivityIndicator color="#111" />
        ) : (
          <Text style={styles.buttonText}>ENVIAR ENTREGA</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    padding: 24,
  },
  card: {
    backgroundColor: '#222222',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    color: '#FFD100',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  info: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
    color: '#AAAAAA',
  },
  photosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  photoBox: {
    alignItems: 'center',
    width: '30%',
  },
  photoDummy: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#333333',
    borderRadius: 8,
    marginTop: 4,
  },
  photoLabel: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  button: {
    backgroundColor: '#FFD100',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#111111',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
