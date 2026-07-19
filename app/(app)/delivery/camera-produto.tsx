import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useDeliveryStore } from '../../../src/store';

export default function CameraProdutoScreen() {
  const router = useRouter();
  const setFotoProduto = useDeliveryStore(state => state.setFotoProduto);
  const fotoProduto = useDeliveryStore(state => state.fotoProduto);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    
    if (!result.canceled && result.assets[0]) {
      setFotoProduto(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    
    if (!result.canceled && result.assets[0]) {
      setFotoProduto(result.assets[0].uri);
    }
  };

  const handleNext = () => {
    if (!fotoProduto) return;
    router.push('/(app)/delivery/recebedor');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instructions}>Fotografe o produto{'\n'}entregue</Text>
      
      <View style={styles.cameraBox}>
        {fotoProduto ? (
          <Image source={{ uri: fotoProduto }} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}>
            <MaterialCommunityIcons name="package-variant" size={64} color="#333" />
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={pickImage}>
          <MaterialCommunityIcons name="image-outline" size={32} color="#FFF" />
          <Text style={styles.controlText}>GALERIA</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.captureBtn} onPress={takePhoto}>
          <View style={styles.captureInner} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn}>
          <MaterialCommunityIcons name="flash" size={32} color="#FFF" />
          <Text style={styles.controlText}>FLASH</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.btnPrimary, !fotoProduto && styles.btnDisabled]} 
          onPress={handleNext}
          disabled={!fotoProduto}
        >
          <Text style={styles.btnPrimaryText}>USAR FOTO</Text>
          <MaterialCommunityIcons name="arrow-right" size={24} color="#111" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  instructions: { color: '#FFF', fontSize: 18, textAlign: 'center', marginTop: 32, marginBottom: 32 },
  cameraBox: { flex: 1, marginHorizontal: 24, backgroundColor: '#1C1C1C', borderRadius: 16, overflow: 'hidden' },
  preview: { flex: 1, width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 40, marginTop: 40, marginBottom: 40 },
  controlBtn: { alignItems: 'center' },
  controlText: { color: '#FFF', fontSize: 12, marginTop: 8 },
  captureBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#111' },
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
