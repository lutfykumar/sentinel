import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

export const useToast = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((
        type: ToastType,
        title: string,
        message?: string,
        duration = 5000
    ) => {
        const id = Math.random().toString(36).substring(2, 11);
        const toast: Toast = { id, type, title, message, duration };

        setToasts(prev => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const success = useCallback((title: string, message?: string, duration?: number) => {
        return showToast('success', title, message, duration);
    }, [showToast]);

    const error = useCallback((title: string, message?: string, duration?: number) => {
        return showToast('error', title, message, duration);
    }, [showToast]);

    const warning = useCallback((title: string, message?: string, duration?: number) => {
        return showToast('warning', title, message, duration);
    }, [showToast]);

    const info = useCallback((title: string, message?: string, duration?: number) => {
        return showToast('info', title, message, duration);
    }, [showToast]);

    const dismiss = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const dismissAll = useCallback(() => {
        setToasts([]);
    }, []);

    return {
        toasts,
        showToast,
        success,
        error,
        warning,
        info,
        dismiss,
        dismissAll
    };
};
