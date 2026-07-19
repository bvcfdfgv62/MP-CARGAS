import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { CameraView } from 'expo-camera';

type PhotoStep = 'ETIQUETA' | 'NOTA_FISCAL' | 'PRODUTO';

export default function PhotosScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  
  const [step, setStep] = useState<PhotoStep>('ETIQUETA');
  const [photos, setPhotos] = useState({
    etiqueta: '',
    nota_fiscal: '',
    produto: '',
  });

  const getStepTitle = () => {
    switch(step) {
      case 'ETIQUETA': return 'Fotografe a Etiqueta';
      case 'NOTA_FISCAL': return 'Fotografe a Nota Fiscal assinada';
      case 'PRODUTO': return 'Fotografe o Produto';
    }
  };

  const currentPhoto = () => {
    switch(step) {
      case 'ETIQUETA': return photos.etiqueta;
      case 'NOTA_FISCAL': return photos.nota_fiscal;
      case 'PRODUTO': return photos.produto;
    }
  };

  const handleCapture = async () => {
    // Simulando captura rápida para não travar o emulador, mas o código real usaria:
    /*
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      savePhoto(photo.uri);
    }
    */
    savePhoto('https://via.placeholder.com/400x600.png?text=Foto+' + step);
  };

  const savePhoto = (uri: string) => {
    if (step === 'ETIQUETA') {
      setPhotos({ ...photos, etiqueta: uri });
    } else if (step === 'NOTA_FISCAL') {
      setPhotos({ ...photos, nota_fiscal: uri });
    } else if (step === 'PRODUTO') {
      setPhotos({ ...photos, produto: uri });
    }
  };

  const handleConfirm = () => {
    if (step === 'ETIQUETA') {
      setStep('NOTA_FISCAL');
    } else if (step === 'NOTA_FISCAL') {
      setStep('PRODUTO');
    } else if (step === 'PRODUTO') {
      // Salvar no store global (Zustand) e avançar
      router.push('/(app)/delivery-flow/receiver');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getStepTitle()}</Text>

      <View style={styles.cameraContainer}>
        {currentPhoto() ? (
          <Image source={{ uri: currentPhoto() }} style={styles.preview} />
        ) : (
          <CameraView style={styles.camera} ref={cameraRef} />
        )}
      </View>

      <View style={styles.footer}>
        {!currentPhoto() ? (
          <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>USAR FOTO</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    padding: 16,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  preview: {
    flex: 1,
    resizeMode: 'cover',
  },
  footer: {
    height: 120,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#111',
  },
  confirmButton: {
    backgroundColor: '#FFD100',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    width: '90%',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontWeight: 'bold',
    color: '#111111',
    fontSize: 16,
  }
});
