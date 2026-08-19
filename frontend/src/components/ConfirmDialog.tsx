import Icon from './Icon';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-md"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[26rem] rounded-xl border border-outline-variant bg-surface-container p-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              danger ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
            }`}
          >
            <Icon name={danger ? 'warning' : 'help'} size={20} />
          </div>
          <h3 className="text-headline-sm font-headline-sm font-semibold text-on-surface">
            {title}
          </h3>
        </div>
        <p className="mb-6 text-body-sm font-body-sm text-on-surface-variant">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded border border-outline-variant px-4 py-2 text-body-sm font-body-sm text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded px-4 py-2 text-body-sm font-body-sm font-semibold transition-colors disabled:opacity-50 ${
              danger
                ? 'bg-error text-on-error hover:bg-error/90'
                : 'bg-primary text-on-primary hover:bg-primary-fixed'
            }`}
          >
            {loading ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
