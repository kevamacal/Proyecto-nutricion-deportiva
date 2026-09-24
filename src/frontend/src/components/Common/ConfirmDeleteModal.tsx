import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { BaseModal } from './BaseModal';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  itemName?: string;
  description?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  itemName,
  description,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      console.error('Error in deletion confirmation:', err);
      setError('Error al eliminar el elemento');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={<AlertTriangle className="w-5 h-5 text-[#FF6B7A]" />}
      maxWidth="440px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && (
          <div
            style={{
              background: 'rgba(178, 58, 72, 0.15)',
              border: '1px solid var(--accent-flag)',
              color: '#FF6B7A',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ color: 'var(--ink-chalk)', fontSize: '0.92rem', lineHeight: 1.5 }}>
          {description || (
            <>
              ¿Estás seguro de que deseas eliminar{' '}
              <strong style={{ color: 'var(--accent-ember)' }}>{itemName || 'este registro'}</strong>?
              Esta acción no se puede deshacer.
            </>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            className="btn-scoreboard secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            style={{
              background: '#B23A48',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '0.6rem 1.1rem',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              opacity: isDeleting ? 0.7 : 1,
            }}
          >
            <Trash2 size={15} />
            {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
