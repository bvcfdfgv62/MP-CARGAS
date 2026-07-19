import { create } from 'zustand';

export interface DeliveryData {
  nf?: string;
  cliente?: string;
  cidade?: string;
  etiqueta_uri?: string;
  nota_fiscal_uri?: string;
  produto_uri?: string;
  recebedor_nome?: string;
  recebedor_cpf?: string;
  recebedor_parentesco?: string;
}

interface DeliveryStore {
  currentDelivery: DeliveryData;
  updateDelivery: (data: Partial<DeliveryData>) => void;
  resetDelivery: () => void;
}

export const useDeliveryStore = create<DeliveryStore>((set) => ({
  currentDelivery: {},
  updateDelivery: (data) => set((state) => ({ 
    currentDelivery: { ...state.currentDelivery, ...data } 
  })),
  resetDelivery: () => set({ currentDelivery: {} }),
}));
