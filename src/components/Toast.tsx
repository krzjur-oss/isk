import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  toastSuccess: (message: string, duration?: number) => void;
  toastError: (message: string, duration?: number) => void;
  toastInfo: (message: string, duration?: number) => void;
  toastWarning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastMessage = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toastSuccess = useCallback((message: string, duration?: number) => toast(message, "success", duration), [toast]);
  const toastError = useCallback((message: string, duration?: number) => toast(message, "error", duration), [toast]);
  const toastInfo = useCallback((message: string, duration?: number) => toast(message, "info", duration), [toast]);
  const toastWarning = useCallback((message: string, duration?: number) => toast(message, "warning", duration), [toast]);

  return (
    <ToastContext.Provider value={{ toast, toastSuccess, toastError, toastInfo, toastWarning }}>
      {children}
      
      {/* Toast container */}
      <div 
        id="toast-notifications-container"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onClose={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onClose: (id: string) => void }> = ({ toast, onClose }) => {
  const { id, message, type, duration = 4000 } = toast;

  // Icon mapping
  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  }[type];

  // Theme colors
  const themeClasses = {
    success: {
      bg: "bg-emerald-50 border-emerald-150 text-emerald-900 shadow-emerald-100/40",
      icon: "text-emerald-600 bg-emerald-100",
      bar: "bg-emerald-500",
    },
    error: {
      bg: "bg-rose-50 border-rose-150 text-rose-900 shadow-rose-100/40",
      icon: "text-rose-600 bg-rose-100",
      bar: "bg-rose-500",
    },
    info: {
      bg: "bg-blue-50 border-blue-150 text-blue-900 shadow-blue-100/40",
      icon: "text-blue-600 bg-blue-100",
      bar: "bg-blue-500",
    },
    warning: {
      bg: "bg-amber-50 border-amber-150 text-amber-900 shadow-amber-100/40",
      icon: "text-amber-600 bg-amber-100",
      bar: "bg-amber-500",
    },
  }[type];

  return (
    <motion.div
      layout
      id={`toast-item-${id}`}
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`pointer-events-auto relative w-full overflow-hidden rounded-xl border p-4 shadow-lg flex items-start gap-3 ${themeClasses.bg} text-left`}
    >
      {/* Icon */}
      <div className={`p-1.5 rounded-lg shrink-0 ${themeClasses.icon}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>

      {/* Message content */}
      <div className="flex-1 pr-4">
        <p className="text-xs font-semibold leading-relaxed">{message}</p>
      </div>

      {/* Close button */}
      <button
        onClick={() => onClose(id)}
        className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-200/50 shrink-0 transition-colors cursor-pointer"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Progress bar animation */}
      {duration > 0 && (
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: duration / 1000, ease: "linear" }}
          className={`absolute bottom-0 left-0 h-0.75 ${themeClasses.bar}`}
        />
      )}
    </motion.div>
  );
};
