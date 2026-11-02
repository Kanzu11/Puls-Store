import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserDTO } from '@/types';
import { toast } from '@/store/toast';

interface AuthState {
  token: string | null;
  user: UserDTO | null;
  authModalOpen: boolean;
  authModalView: 'login' | 'signup';
  setAuth: (token: string, user: UserDTO) => void;
  logout: () => void;
  openAuthModal: (view?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      token: null,
      user: null,
      authModalOpen: false,
      authModalView: 'login',

      setAuth: (token, user) =>
        set({
          token,
          user,
          authModalOpen: false,
        }),

      logout: () => {
        set({
          token: null,
          user: null,
        });
        toast.info('Signed Out', 'You have been logged out of your PulseStore account.');
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', '/');
          window.dispatchEvent(new PopStateEvent('popstate'));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      },

      openAuthModal: (view = 'login') =>
        set({
          authModalOpen: true,
          authModalView: view,
        }),

      closeAuthModal: () =>
        set({
          authModalOpen: false,
        }),
    }),
    {
      name: 'pulsestore-auth',
      partialize: state => ({ token: state.token, user: state.user }),
    }
  )
);
