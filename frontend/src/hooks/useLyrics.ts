// 歌詞ドキュメントとアノテーションの React Query ラッパーをまとめたフック群。
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import type { LyricDocument, LyricVersionSnapshot, Annotation } from '../types';
import { useAnnotuneApi } from './useAnnotuneApi';

const keys = {
  // ユーザーごとの歌詞一覧をキャッシュするキー
  list: (userId: string) => ['lyrics', userId] as const,
  // 個別ドキュメント詳細のキャッシュキー
  lyric: (docId: string) => ['lyrics', 'detail', docId] as const,
  // バージョン履歴のキャッシュキー
  versions: (docId: string) => ['lyrics', 'versions', docId] as const
};

export const useLyricsList = () => {
  const { api, userId, isAuthenticated, mode } = useAnnotuneApi();
  return useQuery<LyricDocument[]>({
    // 一覧取得（mine=true 相当）
    queryKey: keys.list(userId),
    queryFn: () => api.listLyrics(userId),
    staleTime: 1000 * 10,
    enabled: mode === 'mock' || isAuthenticated
  });
};

export const useLyric = (docId: string) => {
  const { api, mode, isAuthenticated } = useAnnotuneApi();
  return useQuery<LyricDocument | undefined>({
    queryKey: keys.lyric(docId),
    queryFn: () => api.getLyric(docId),
    // まだ docId が決まっていない場合（URL 読み込み中など）は実行しない
    enabled: Boolean(docId) && (mode === 'mock' || isAuthenticated)
  });
};

export const usePublicLyric = (docId: string) => {
  const { api } = useAnnotuneApi();
  return useQuery<LyricDocument | undefined>({
    queryKey: ['lyrics', 'public', docId],
    queryFn: () => api.getPublicLyric(docId),
    enabled: Boolean(docId)
  });
};

export const usePublicLyricsList = (filters?: {
  title?: string;
  artist?: string;
  author?: string;
}) => {
  const { api } = useAnnotuneApi();
  const title = filters?.title?.trim() ?? '';
  const artist = filters?.artist?.trim() ?? '';
  const author = filters?.author?.trim() ?? '';

  return useQuery<LyricDocument[]>({
    queryKey: ['lyrics', 'public', title, artist, author],
    queryFn: () =>
      api.searchPublicLyrics({
        title: title || undefined,
        artist: artist || undefined,
        author: author || undefined
      }),
    staleTime: 1000 * 30
  });
};

export const useLyricVersions = (docId: string) => {
  const { api, mode, isAuthenticated } = useAnnotuneApi();
  return useQuery<LyricVersionSnapshot[]>({
    queryKey: keys.versions(docId),
    queryFn: () => api.listVersions(docId),
    // ドキュメント ID が空のときは API を呼ばず、無駄なリクエストを避ける
    enabled: Boolean(docId) && (mode === 'mock' || isAuthenticated)
  });
};

export const useCreateLyric = () => {
  const { api, userId, mode, isAuthenticated } = useAnnotuneApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; artist?: string; text: string }) =>
      api.createLyric(userId, payload),
    onSuccess: () => {
      // 作成後に一覧を再取得し、成功トーストを表示
      queryClient.invalidateQueries({ queryKey: keys.list(userId) });
      toast.success('ドキュメントを作成しました');
    },
    retry: (failureCount: number) => {
      if (mode === 'mock' || isAuthenticated) {
        return failureCount < 3;
      }
      return false;
    }
  });
};

export const useUpdateLyric = (docId: string) => {
  const { api } = useAnnotuneApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; artist?: string; text: string; version: number }) =>
      api.updateLyric(docId, payload),
    onSuccess: (lyric: LyricDocument) => {
      // 詳細・一覧双方のキャッシュを更新
      queryClient.invalidateQueries({ queryKey: keys.lyric(docId) });
      queryClient.invalidateQueries({ queryKey: keys.list(lyric.ownerId) });
      toast.success('ドキュメントを更新しました');
    }
  });
};

export const useDeleteLyric = (docId: string) => {
  const { api, userId } = useAnnotuneApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.deleteLyric(docId),
    onSuccess: () => {
      // 削除後は一覧を更新してカードを消す
      queryClient.invalidateQueries({ queryKey: keys.list(userId) });
      toast.success('ドキュメントを削除しました');
    }
  });
};

export const useShareLyric = (docId: string) => {
  const { api } = useAnnotuneApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isPublic: boolean) => api.shareLyric(docId, isPublic),
    onSuccess: (lyric: LyricDocument) => {
      // 詳細キャッシュを更新し、公開状態に応じたメッセージを表示
      queryClient.invalidateQueries({ queryKey: keys.lyric(docId) });
      toast.success(lyric.isPublicView ? '公開リンクを有効にしました' : '公開リンクを無効にしました');
    }
  });
};

export const useAnnotationMutations = (docId: string) => {
  const { api, userId } = useAnnotuneApi();
  const queryClient = useQueryClient();

  const invalidate = () => {
    // 詳細画面のキャッシュを更新
    queryClient.invalidateQueries({ queryKey: keys.lyric(docId) });
  };

  // 新規アノテーションを作成するミューテーション
  const create = useMutation({
    mutationFn: (payload: Omit<Annotation, 'annotationId' | 'createdAt' | 'updatedAt' | 'authorId'>) =>
      api.createAnnotation(docId, userId, payload),
    onSuccess: () => {
      invalidate();
      toast.success('アノテーションを追加しました');
    }
  });

  // 既存アノテーションを更新するミューテーション
  const update = useMutation({
    mutationFn: ({
      annotationId,
      ...payload
    }: {
      annotationId: string;
      start: number;
      end: number;
      tag: Annotation['tag'];
      comment?: string;
      props?: Annotation['props'];
    }) => api.updateAnnotation(docId, annotationId, payload),
    onSuccess: () => {
      invalidate();
      toast.success('アノテーションを更新しました');
    }
  });

  // アノテーションを削除するミューテーション
  const remove = useMutation({
    mutationFn: (annotationId: string) => api.deleteAnnotation(docId, annotationId),
    onSuccess: () => {
      invalidate();
      toast.success('アノテーションを削除しました');
    }
  });

  return { create, update, remove };
};
