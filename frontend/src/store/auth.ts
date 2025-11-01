// このストアは Cognito 認証情報を保持し、アプリ全体から参照できるようにする。
import { create, type StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  userId: string;
  displayName: string;
  idToken: string | null;
  accessToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  setAuthenticated(params: {
    userId: string;
    displayName: string;
    idToken: string;
    accessToken?: string | null;
    expiresAt?: number | null;
  }): void;
  signOut(): void;
}

const INITIAL_STATE: Omit<AuthState, 'setAuthenticated' | 'signOut'> = {
  userId: '',
  displayName: '',
  idToken: null,
  accessToken: null,
  expiresAt: null,
  isAuthenticated: false
};

const createAuthStore: StateCreator<AuthState> = (set) => ({
  ...INITIAL_STATE,
  // サインインが完了した際に呼び出し、ユーザー情報とトークンを保存
  setAuthenticated: ({
    userId,
    displayName,
    idToken,
    accessToken,
    expiresAt
  }: {
    userId: string;
    displayName: string;
    idToken: string;
    accessToken?: string | null;
    expiresAt?: number | null;
  }) =>
    set({
      userId,
      displayName,
      idToken,
      accessToken: accessToken ?? null,
      expiresAt: expiresAt ?? null,
      isAuthenticated: true
    }),
  // サインアウト時に状態をクリア
  signOut: () => set({ ...INITIAL_STATE })
});

const noopStorage: Storage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
  key: () => null,
  get length() {
    return 0;
  }
};

export const useAuthStore = create<AuthState>()(
  persist(createAuthStore, {
    name: 'annotune-auth',
    storage: createJSONStorage(() =>
      typeof window !== 'undefined'
        ? window.localStorage
        : noopStorage
    )
  })
);

export type { AuthState };
