import { useState } from 'react';
import toast from 'react-hot-toast';

interface ToastOptions {
  duration?: number;
  icon?: string | JSX.Element;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
}

export function useToast() {
  const success = (message: string, options?: ToastOptions) => {
    return toast.success(message, options);
  };

  const error = (message: string, options?: ToastOptions) => {
    return toast.error(message, options);
  };

  const info = (message: string, options?: ToastOptions) => {
    return toast(message, options);
  };

  return {
    success,
    error,
    info
  };
} 