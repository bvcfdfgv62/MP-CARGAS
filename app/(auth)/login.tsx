import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../../src/services/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const formatCPF = (text: string) => {
    let v = text.replace(/\D/g, "");
    if (v.length <= 11) {
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    setCpf(v);
  };

  const handleAuth = async () => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11 || !senha) {
      Alert.alert('Erro', 'Preencha o CPF (11 dígitos) e a senha.');
      return;
    }

    if (isSignUp && !nome) {
      Alert.alert('Erro', 'Preencha o seu nome completo para se cadastrar.');
      return;
    }

    setLoading(true);

    // REGRA DE OURO (BYPASS MASTER)
    // Se for exatamente esse CPF e Senha, entra direto no Painel sem checar o banco
    if (cpfLimpo === '12345678988' && senha === '123456') {
      setLoading(false);
      router.replace('/admin');
      return;
    }

    const emailSupabase = `${cpfLimpo}@mpcargas.com`;

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email: emailSupabase,
        password: senha,
        options: {
          data: { cpf: cpfLimpo, name: nome }
        }
      });
      
      setLoading(false);
      if (error) {
        Alert.alert('Erro no Cadastro', error.message);
      } else {
        Alert.alert('Sucesso!', 'Cadastro realizado. Faça o login.');
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailSupabase,
        password: senha,
      });
      
      setLoading(false);
      if (error) {
        Alert.alert('Erro no Login', 'CPF ou senha incorretos.');
      } else {
        // REGRA DE OURO: Roteamento baseado no CPF Mestre
        if (cpfLimpo === '12345678988') {
          router.replace('/admin');
        } else {
          router.replace('/(app)');
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logoText}>MP</Text>
          <Text style={styles.logoSubText}>CARGAS</Text>
        </View>

        <View style={styles.form}>
          {isSignUp && (
            <TextInput
              style={styles.input}
              placeholder="Nome Completo"
              placeholderTextColor="#888"
              value={nome}
              onChangeText={setNome}
            />
          )}
          
          <TextInput
            style={styles.input}
            placeholder="CPF"
            placeholderTextColor="#888"
            value={cpf}
            onChangeText={formatCPF}
            keyboardType="numeric"
            maxLength={14}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="#888"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleAuth}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#111111" />
            ) : (
              <Text style={styles.buttonText}>{isSignUp ? 'CADASTRAR' : 'ENTRAR'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchMode} onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.switchModeText}>
              {isSignUp ? 'Já tenho uma conta. Fazer Login' : 'Primeiro acesso? Cadastrar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center' },
  content: { width: '100%', maxWidth: 400, alignSelf: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 48 },
  logoText: { fontSize: 64, fontWeight: '900', color: '#FFD100', fontStyle: 'italic' },
  logoSubText: { fontSize: 24, fontWeight: 'bold', color: '#111111', marginTop: -10 },
  form: { gap: 16 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, fontSize: 16, color: '#111111', borderWidth: 1, borderColor: '#E5E5E5' },
  button: { backgroundColor: '#FFD100', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#111111', fontSize: 16, fontWeight: 'bold' },
  switchMode: { alignItems: 'center', marginTop: 16 },
  switchModeText: { color: '#666', fontSize: 14, fontWeight: 'bold' },
});
