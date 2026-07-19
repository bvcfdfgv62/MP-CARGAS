import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Precisamos de acesso à câmera para escanear o QR Code.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Permitir Câmera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    // Simula a leitura do QR Code e avança
    // Normalmente salvaríamos esse dado no estado global
    router.push('/(app)/delivery-flow/photos');
  };

  const handleManual = () => {
    // Avança para tela manual ou usa um dado mockado para prosseguir
    router.push('/(app)/delivery-flow/photos');
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={handleBarcodeScanned}
      />
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
        <Text style={styles.instruction}>Posicione o QR Code da Nota Fiscal no centro</Text>
        
        <TouchableOpacity style={styles.manualButton} onPress={handleManual}>
          <Text style={styles.manualButtonText}>PULAR / TESTAR FLUXO</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    color: '#FFF',
    paddingBottom: 10,
  },
  button: {
    backgroundColor: '#FFD100',
    padding: 16,
    borderRadius: 8,
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#111',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#FFD100',
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  instruction: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  manualButton: {
    marginTop: 40,
    backgroundColor: '#FFD100',
    padding: 16,
    borderRadius: 12,
  },
  manualButtonText: {
    fontWeight: 'bold',
    color: '#111',
  }
});
