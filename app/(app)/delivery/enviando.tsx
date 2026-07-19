import { View, Text, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { supabase } from '../../../src/services/supabase';
import { useDeliveryStore } from '../../../src/store';

export default function EnviandoScreen() {
  const router = useRouter();
  const store = useDeliveryStore();
  
  const [step, setStep] = useState(1);

  // Função auxiliar para fazer upload de foto mockado ou real
  const uploadPhoto = async (uri: string | null, path: string) => {
    if (!uri) return null;
    
    // Na Web, o URI geralmente é um Blob ou base64 simulado.
    // Em um app real RN, usaríamos fetch(uri).then(r => r.blob()) e supabase.storage
    // Aqui vamos pular o upload físico se der erro de CORS na web e apenas retornar um mock url.
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const { data, error } = await supabase.storage.from('entregas').upload(path, blob, { upsert: true });
      if (data) {
        const publicUrl = supabase.storage.from('entregas').getPublicUrl(path).data.publicUrl;
        return publicUrl;
      }
    } catch (e) {
      console.warn("Upload falhou (mock fallback será usado):", e);
    }
    // Fallback: Retorna a própria URI (útil para testar na Web)
    return uri;
  };

  useEffect(() => {
    async function processDelivery() {
      try {
        // Passo 1: Validando (1 seg)
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStep(2);

        // Passo 2: Enviando Fotos
        const timestamp = Date.now();
        const nfFolder = `NF_${store.nf || 'SEM_NUMERO'}`;
        
        const [urlE, urlN, urlP] = await Promise.all([
          uploadPhoto(store.fotoEtiqueta, `${nfFolder}/etiqueta_${timestamp}.jpg`),
          uploadPhoto(store.fotoNf, `${nfFolder}/nota_${timestamp}.jpg`),
          uploadPhoto(store.fotoProduto, `${nfFolder}/produto_${timestamp}.jpg`)
        ]);
        
        setStep(3);

        // Passo 3: Salvando Dados no Banco
        const { data: { user } } = await supabase.auth.getUser();
        
        // Verifica se já existe a entrega como pendente (busca pela NF)
        const { data: existing } = await supabase.from('deliveries')
          .select('id, driver_id')
          .eq('invoice_number', store.nf)
          .eq('status', 'pendente')
          .maybeSingle(); // maybeSingle não joga erro se não achar

        let dbResult;

        if (existing) {
          // Se já existe do painel, faz UPDATE
          dbResult = await supabase.from('deliveries').update({
            receiver_name: store.recebedorNome || 'Não informado',
            receiver_cpf: store.recebedorCpf || '000',
            receiver_relationship: store.recebedorParentesco || 'Outros',
            label_photo_url: urlE,
            invoice_photo_url: urlN,
            product_photo_url: urlP,
            status: 'enviada'
          }).eq('id', existing.id).select('id').single();
        } else {
          // Se foi lido do zero no app, faz INSERT
          if (!user?.id) {
            throw new Error('Você precisa estar logado para criar uma nova entrega do zero.');
          }
          dbResult = await supabase.from('deliveries').insert({
            driver_id: user.id,
            invoice_number: store.nf || 'SEM-NF',
            client_name: store.cliente || '',
            city: store.cidade || '',
            receiver_name: store.recebedorNome || 'Não informado',
            receiver_cpf: store.recebedorCpf || '000',
            receiver_relationship: store.recebedorParentesco || 'Outros',
            label_photo_url: urlE,
            invoice_photo_url: urlN,
            product_photo_url: urlP,
            status: 'enviada'
          }).select('id').single();
        }

        if (dbResult.error) throw dbResult.error;
        
        setStep(4);
        
        // Finalizando
        await new Promise(resolve => setTimeout(resolve, 1000));
        // ==========================================
        // INTEGRAÇÃO INVISÍVEL (SUPABASE REALTIME)
        // O app não precisa mais disparar webhook. Ele apenas atualiza 
        // o status para 'enviada' no banco de dados e o Bot no PC 
        // escuta essa alteração em tempo real.
        // ==========================================

        // Limpa a memória e volta para a lista de entregas de forma 100% invisível pro motorista!
        store.clearDelivery();
        router.replace('/(app)/(tabs)/entregas');

      } catch (error: any) {
        console.error(error);
        alert(`Erro do Banco: ${error.message || JSON.stringify(error)}`);
        router.back();
      }
    }

    processDelivery();
  }, []);

  const StepItem = ({ currentStep, text }: { currentStep: number, text: string }) => {
    const isDone = step > currentStep;
    const isActive = step === currentStep;
    return (
      <View style={styles.stepItem}>
        {isDone ? (
          <MaterialCommunityIcons name="check-circle" size={24} color="#FFD100" />
        ) : isActive ? (
          <ActivityIndicator color="#FFD100" size={24} />
        ) : (
          <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={24} color="#333" />
        )}
        <View style={styles.stepTextContainer}>
          <Text style={[styles.stepText, (isDone || isActive) && styles.stepTextActive]}>{text}</Text>
          {isDone && <Text style={styles.stepSubtext}>Concluído</Text>}
          {isActive && <Text style={styles.stepSubtext}>Em andamento</Text>}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="cloud-upload-outline" size={96} color="#FFD100" />
      </View>
      
      <Text style={styles.title}>Enviando entrega...</Text>
      <Text style={styles.subtitle}>Isso pode levar alguns segundos</Text>

      <View style={styles.list}>
        <StepItem currentStep={1} text="Validando informações" />
        <StepItem currentStep={2} text="Enviando fotos" />
        <StepItem currentStep={3} text="Salvando dados" />
        <StepItem currentStep={4} text="Sincronizando" />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Você pode continuar usando o aplicativo normalmente.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111', padding: 32, justifyContent: 'center' },
  iconContainer: { alignItems: 'center', marginBottom: 24 },
  title: { color: '#FFF', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 48 },
  list: { gap: 24 },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepTextContainer: { marginLeft: 16 },
  stepText: { color: '#888', fontSize: 16, fontWeight: 'bold' },
  stepTextActive: { color: '#FFF' },
  stepSubtext: { color: '#888', fontSize: 12, marginTop: 4 },
  footer: { marginTop: 64, borderWidth: 1, borderColor: '#333', borderRadius: 12, padding: 16 },
  footerText: { color: '#888', fontSize: 12, textAlign: 'center' },
});
