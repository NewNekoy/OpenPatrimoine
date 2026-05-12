import { useUiStore } from '../stores/ui.store'

export function useModal() {
  const { openModal, closeModal } = useUiStore()
  return { openModal, closeModal }
}
