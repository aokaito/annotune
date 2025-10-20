// Cognito 認証情報を保持するシンプルな Zustand ストア。
import { create } from 'zustand';

interface AuthState {
  userId: string;
  displayName: string;
  isAuthenticated: boolean;
  setAuthenticated(userId: string, displayName: string): void;
  signOut(): void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: 'demo-user',
  displayName: 'Demo Vocalist',
  isAuthenticated: true,
  setAuthenticated: (userId, displayName) =>
    set({
      userId,
      displayName,
      isAuthenticated: true
    }),
  signOut: () =>
    set({
      userId: '',
      displayName: '',
      isAuthenticated: false
    })
}));
