// モック API と認証情報をまとめて提供するフック。
import { mockApi } from '../api/client';
import { useAuthStore } from '../store/auth';

export const useAnnotuneApi = () => {
  const userId = useAuthStore((state) => state.userId);

  return {
    // 本番ではここを実 API クライアントに差し替える想定
    api: mockApi,
    userId
  };
};
