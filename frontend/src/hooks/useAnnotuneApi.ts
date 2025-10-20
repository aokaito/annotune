import { mockApi } from '../api/client';
import { useAuthStore } from '../store/auth';

export const useAnnotuneApi = () => {
  const userId = useAuthStore((state) => state.userId);

  return {
    api: mockApi,
    userId
  };
};
