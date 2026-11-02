import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>(set => ({
  toasts: [],

  addToast: toast => {
    const id = Math.random().toString(36).slice(2, 9);
    set(state => ({
      toasts: [...state.toasts.slice(-3), { ...toast, id }],
    }));
    setTimeout(() => {
      set(state => ({
        toasts: state.toasts.filter(t => t.id !== id),
      }));
    }, 3800);
  },

  removeToast: id =>
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    })),
}));

export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, type: 'success' }),
  error: (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, type: 'error' }),
  info: (title: string, description?: string) =>
    useToastStore.getState().addToast({ title, description, type: 'info' }),
};

