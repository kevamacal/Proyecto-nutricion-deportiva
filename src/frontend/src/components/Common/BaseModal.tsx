import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  zIndex?: number;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = '540px',
  zIndex = 1200,
}) => {
  // Listen for Escape key press to close modal cleanly
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="modal-overlay"
          onClick={onClose}
          style={{ zIndex }}
          aria-hidden="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{
              maxWidth,
              width: '95%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Standardized Header */}
            <div
              style={{
                display: 'flex',
                justifyItems: 'space-between',
                alignItems: 'center',
                marginBottom: subtitle ? '1.25rem' : '1rem',
                borderBottom: '1px solid var(--glass-border)',
                paddingBottom: '0.85rem',
              }}
            >
              <div>
                <h3
                  className="glass-card-title"
                  style={{
                    margin: 0,
                    fontSize: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  {icon}
                  {title}
                </h3>
                {subtitle && (
                  <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar modal"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ink-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
