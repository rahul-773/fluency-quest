import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  accent?: 'green' | 'amber' | 'pink' | 'cyan' | 'sky';
  size?: 'sm' | 'md' | 'lg';
}

const accentMap: Record<string, string> = {
  green: 'glow-green',
  amber: 'glow-amber',
  pink: 'glow-pink',
  cyan: 'glow-cyan',
  sky: 'glow-sky',
};

export default function Modal({ open, onClose, title, children, accent = 'cyan', size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-3xl' : 'max-w-lg';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={`relative panel rounded-2xl w-full ${sizeClass} ${accentMap[accent]} animate-pop-in p-6`}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-bold tracking-wide text-white">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/60 hover:text-white transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
