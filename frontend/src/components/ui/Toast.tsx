import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 4500);
    },
    [removeToast]
  );

  const value = {
    toast: addToast,
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
    info: (msg: string) => addToast(msg, 'info'),
  };

  const config = {
    success: {
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      styles: 'border-emerald-200/80 bg-emerald-50/60',
      text: 'text-emerald-900',
    },
    error: {
      icon: <AlertCircle className="w-4 h-4 text-rose-600" />,
      styles: 'border-rose-200/80 bg-rose-50/60',
      text: 'text-rose-900',
    },
    info: {
      icon: <Info className="w-4 h-4 text-violet-600" />,
      styles: 'border-[var(--border-default)] bg-white',
      text: 'text-[var(--color-ink-700)]',
    },
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-[360px] w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const c = config[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className={cn(
                  'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] border backdrop-blur-sm',
                  c.styles
                )}
              >
                <span className="shrink-0 mt-0.5">{c.icon}</span>
                <p className={cn('flex-1 text-sm font-medium leading-snug', c.text)}>{t.message}</p>
                <button
                  onClick={() => removeToast(t.id)}
                  className="shrink-0 text-[var(--color-ink-300)] hover:text-[var(--color-ink-700)] -mr-1 -mt-0.5 p-1 rounded-md transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
