import { useUiStore } from '../../stores/ui.store'

// Enregistre ici les modals métier quand ils seront créés :
// const MODALS: Record<string, React.ComponentType<any>> = {
//   'property-form': PropertyFormModal,
//   'confirm-delete': ConfirmDeleteModal,
// }
const MODALS: Record<string, React.ComponentType<Record<string, unknown>>> = {}

export function ModalRoot() {
  const { modal, closeModal } = useUiStore()
  if (!modal) return null

  const Modal = MODALS[modal.type]
  if (!Modal) return null

  return <Modal {...(modal.props ?? {})} onClose={closeModal} />
}
