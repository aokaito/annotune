// 歌詞ドキュメントとアノテーションの React Query ラッパーをまとめたフック群。
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import type { LyricDocument, LyricVersionSnapshot, Annotation } from '../types';
import { useAnnotuneApi } from './useAnnotuneApi';

const keys = {
  list: (userId: string) => ['lyrics', userId] as const,
  lyric: (docId: string) => ['lyrics', 'detail', docId] as const,
  versions: (docId: string) => ['lyrics', 'versions', docId] as const
};

export const useLyricsList = () => {
  const { api, userId } = useAnnotuneApi();
  return useQuery({
    // 一覧取得（mine=true 相当）
    queryKey: keys.list(userId),
    queryFn: () => api.listLyrics(userId),
    staleTime: 1000 * 10
  });
};

export const useLyric = (docId: string) => {
  const { api } = useAnnotuneApi();
  return useQuery({
    queryKey: keys.lyric(docId),
    queryFn: () => api.getLyric(docId),
    enabled: Boolean(docId)
  });
};

export const useLyricVersions = (docId: string) => {
  const { api } = useAnnotuneApi();
  return useQuery<LyricVersionSnapshot[]>({
    queryKey: keys.versions(docId),
    queryFn: () => api.listVersions(docId),
    enabled: Boolean(docId)
  });
};

export const useCreateLyric = () => {
  const { api, userId } = useAnnotuneApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; text: string }) => api.createLyric(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(userId) });
      toast.success('Lyric created');
    }
  });
};

export const useUpdateLyric = (docId: string) => {
  const { api } = useAnnotuneApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; text: string; version: number }) =>
      api.updateLyric(docId, payload),
    onSuccess: (lyric) => {
      queryClient.invalidateQueries({ queryKey: keys.lyric(docId) });
      queryClient.invalidateQueries({ queryKey: keys.list(lyric.ownerId) });
      toast.success('Lyric updated');
    }
  });
};

export const useDeleteLyric = (docId: string) => {
  const { api, userId } = useAnnotuneApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.deleteLyric(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(userId) });
      toast.success('Lyric deleted');
    }
  });
};

export const useShareLyric = (docId: string) => {
  const { api } = useAnnotuneApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isPublic: boolean) => api.shareLyric(docId, isPublic),
    onSuccess: (lyric) => {
      queryClient.invalidateQueries({ queryKey: keys.lyric(docId) });
      toast.success(lyric.isPublicView ? 'Public sharing enabled' : 'Public sharing disabled');
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

  const create = useMutation({
    mutationFn: (payload: Omit<Annotation, 'annotationId' | 'createdAt' | 'updatedAt' | 'authorId'>) =>
      api.createAnnotation(docId, userId, payload),
    onSuccess: () => {
      invalidate();
      toast.success('Annotation added');
    }
  });

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
      toast.success('Annotation updated');
    }
  });

  const remove = useMutation({
    mutationFn: (annotationId: string) => api.deleteAnnotation(docId, annotationId),
    onSuccess: () => {
      invalidate();
      toast.success('Annotation removed');
    }
  });

  return { create, update, remove };
};
