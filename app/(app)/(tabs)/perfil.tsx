import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../src/services/supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

export default function PerfilScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('Carregando...');
  const [userCpf, setUserCpf] = useState('...');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      if (user.user_metadata?.name) setUserName(user.user_metadata.name);
      if (user.user_metadata?.cpf) setUserCpf(user.user_metadata.cpf);
      if (user.user_metadata?.avatar_url) setAvatarUrl(user.user_metadata.avatar_url);
    }
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      uploadAvatar(result.assets[0].base64, result.assets[0].uri);
    }
  };

  const uploadAvatar = async (base64Image: string, uri: string) => {
    setLoading(true);
    try {
      // Usamos o bucket "entregas" que já existe, na pasta avatars
      const fileName = `avatars/${user.id}_${Date.now()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('entregas')
        .upload(fileName, decode(base64Image), {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('entregas').getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      // Atualiza os metadados do usuário com a nova foto
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      Alert.alert('Sucesso', 'Foto de perfil atualizada!');
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível atualizar a foto: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meu Perfil</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickAvatar} disabled={loading}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons name="account" size={64} color="#333" />
              </View>
            )}
            
            {loading ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#FFD100" />
              </View>
            ) : (
              <View style={styles.editBadge}>
                <MaterialCommunityIcons name="camera" size={16} color="#111" />
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userCpf}>CPF: {userCpf}</Text>
        </View>

        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Em breve', 'Seus dados já estão sincronizados com o RH.')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#1C1C1C' }]}>
                <MaterialCommunityIcons name="shield-account" size={22} color="#FFD100" />
              </View>
              <Text style={styles.menuText}>Meus Dados</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Notificações', 'Você não tem novos avisos no momento.')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#1C1C1C' }]}>
                <MaterialCommunityIcons name="bell" size={22} color="#FFD100" />
              </View>
              <Text style={styles.menuText}>Notificações</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0, marginTop: 32 }]} onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#3A1E1E' }]}>
                <MaterialCommunityIcons name="logout" size={22} color="#F44336" />
              </View>
              <Text style={[styles.menuText, { color: '#F44336' }]}>Sair do Aplicativo</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  header: {
    backgroundColor: '#FFD100',
    padding: 24,
    paddingTop: 64,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center'
  },
  title: { fontSize: 20, fontWeight: '900', color: '#111', letterSpacing: -0.5 },
  
  content: { padding: 24, flex: 1 },
  
  avatarSection: { alignItems: 'center', marginTop: 16, marginBottom: 40 },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#1C1C1C' },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1C1C1C', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#111' },
  avatarOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  editBadge: { position: 'absolute', bottom: 4, right: 4, backgroundColor: '#FFD100', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#111' },
  
  userName: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  userCpf: { fontSize: 14, color: '#888', fontWeight: '500' },

  menu: { backgroundColor: '#1C1C1C', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuText: { fontSize: 16, fontWeight: '600', color: '#FFF' }
});
