// このストアは Cognito 認証情報を保持し、アプリ全体から参照できるようにする。
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
  // サインインが完了した際に呼び出し、ユーザー情報を保存
  setAuthenticated: (userId, displayName) =>
    set({
      userId,
      displayName,
      isAuthenticated: true
    }),
  // サインアウト時に状態をクリア
  signOut: () =>
    set({
      userId: '',
      displayName: '',
      isAuthenticated: false
    })
}));
