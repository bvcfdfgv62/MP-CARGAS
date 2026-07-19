import { create } from 'zustand';

interface DeliveryState {
  // Dados da nota
  nf: string;
  cliente: string;
  cidade: string;
  
  // Fotos (URIs locais temporárias)
  fotoEtiqueta: string | null;
  fotoNf: string | null;
  fotoProduto: string | null;
  
  // Recebedor
  recebedorNome: string;
  recebedorCpf: string;
  recebedorParentesco: string;

  // Actions
  setNotaData: (nf: string, cliente: string, cidade: string) => void;
  setFotoEtiqueta: (uri: string) => void;
  setFotoNf: (uri: string) => void;
  setFotoProduto: (uri: string) => void;
  setRecebedor: (nome: string, cpf: string, parentesco: string) => void;
  clearDelivery: () => void;
}

export const useDeliveryStore = create<DeliveryState>((set) => ({
  nf: '',
  cliente: '',
  cidade: '',
  fotoEtiqueta: null,
  fotoNf: null,
  fotoProduto: null,
  recebedorNome: '',
  recebedorCpf: '',
  recebedorParentesco: '',

  setNotaData: (nf, cliente, cidade) => set({ nf, cliente, cidade }),
  setFotoEtiqueta: (uri) => set({ fotoEtiqueta: uri }),
  setFotoNf: (uri) => set({ fotoNf: uri }),
  setFotoProduto: (uri) => set({ fotoProduto: uri }),
  setRecebedor: (nome, cpf, parentesco) => set({ recebedorNome: nome, recebedorCpf: cpf, recebedorParentesco: parentesco }),
  
  clearDelivery: () => set({
    nf: '', cliente: '', cidade: '',
    fotoEtiqueta: null, fotoNf: null, fotoProduto: null,
    recebedorNome: '', recebedorCpf: '', recebedorParentesco: ''
  })
}));
