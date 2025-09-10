import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Toast } from '@/hooks/useToast';

interface ToastContainerProps {
    toasts: Toast[];
    onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
    const getToastIcon = (type: Toast['type']) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-400" />;
            case 'error':
                return <AlertCircle className="h-5 w-5 text-red-400" />;
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
            case 'info':
                return <Info className="h-5 w-5 text-blue-400" />;
            default:
                return <Info className="h-5 w-5 text-blue-400" />;
        }
    };

    const getToastStyles = (type: Toast['type']) => {
        switch (type) {
            case 'success':
                return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
            case 'error':
                return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
            case 'info':
                return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
            default:
                return 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800';
        }
    };

    const getTextStyles = (type: Toast['type']) => {
        switch (type) {
            case 'success':
                return 'text-green-800 dark:text-green-200';
            case 'error':
                return 'text-red-800 dark:text-red-200';
            case 'warning':
                return 'text-yellow-800 dark:text-yellow-200';
            case 'info':
                return 'text-blue-800 dark:text-blue-200';
            default:
                return 'text-gray-800 dark:text-gray-200';
        }
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`max-w-md w-full bg-white border rounded-lg shadow-lg p-4 transition-all duration-300 ease-in-out transform pointer-events-auto animate-in slide-in-from-right-2 ${getToastStyles(toast.type)}`}
                >
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            {getToastIcon(toast.type)}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                            <p className={`text-sm font-medium break-words ${getTextStyles(toast.type)}`}>
                                {toast.title}
                            </p>
                            {toast.message && (
                                <p className={`mt-1 text-sm break-words ${getTextStyles(toast.type)} opacity-80`}>
                                    {toast.message}
                                </p>
                            )}
                        </div>
                        <div className="ml-4 flex-shrink-0 flex">
                            <button
                                type="button"
                                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600 ${getTextStyles(toast.type)} hover:opacity-75`}
                                onClick={() => onDismiss(toast.id)}
                            >
                                <span className="sr-only">Dismiss</span>
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
