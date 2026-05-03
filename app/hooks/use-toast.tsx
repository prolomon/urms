import React, { createContext, useCallback, useContext, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'default' | 'success' | 'warn' | 'failed';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, options?: ToastOptions) => string;
  success: (message: string, duration?: number) => string;
  warn: (message: string, duration?: number) => string;
  failed: (message: string, duration?: number) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const insets = useSafeAreaInsets();

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    const id = Math.random().toString(36).substring(7);
    const type = options?.type || 'default';
    const duration = options?.duration || 3000;

    const newToast: Toast = {
      id,
      message,
      type,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);

    return id;
  }, []);

  const success = useCallback(
    (message: string, duration?: number) => {
      return showToast(message, { type: 'success', duration });
    },
    [showToast]
  );

  const warn = useCallback(
    (message: string, duration?: number) => {
      return showToast(message, { type: 'warn', duration });
    },
    [showToast]
  );

  const failed = useCallback(
    (message: string, duration?: number) => {
      return showToast(message, { type: 'failed', duration });
    },
    [showToast]
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return { backgroundColor: '#10b981', borderColor: '#059669' };
      case 'warn':
        return { backgroundColor: '#f59e0b', borderColor: '#d97706' };
      case 'failed':
        return { backgroundColor: '#ef4444', borderColor: '#dc2626' };
      default:
        return { backgroundColor: '#374151', borderColor: '#1f2937' };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, success, warn, failed, dismiss, dismissAll }}>
      {children}
      <View style={[styles.toastContainer, { top: insets.top + 10 }]} pointerEvents="box-none">
        {toasts.map((toast) => (
          <TouchableOpacity
            key={toast.id}
            activeOpacity={0.9}
            onPress={() => dismiss(toast.id)}
            style={[styles.toast, getToastStyle(toast.type)]}
          >
            <Text style={styles.toastText}>{toast.message}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 9999,
  },
  toast: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: 200,
    maxWidth: '90%',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
