import Modal from './Modal'

export default function Confirm({ open, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Confirm', danger = false }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={() => { onConfirm?.(); onClose?.() }}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-700 dark:text-slate-300">{message}</p>
    </Modal>
  )
}
