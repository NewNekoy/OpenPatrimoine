import { create } from 'zustand'

export interface ModalState {
  type: string
  props?: Record<string, unknown>
}

interface UiStore {
  modal: ModalState | null
  openModal: (type: string, props?: Record<string, unknown>) => void
  closeModal: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  modal: null,
  openModal: (type, props) => set({ modal: { type, props } }),
  closeModal: () => set({ modal: null })
}))
