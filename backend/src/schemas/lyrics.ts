// このファイルでは API 入力を検証する zod スキーマを定義する。
import { z } from 'zod';

// アノテーションに付随する任意プロパティ
export const annotationPropsSchema = z
  .object({
    voiceQuality: z.enum(['whisper', 'edge', 'falsetto']).optional()
  })
  .passthrough()
  .optional();

// 新規歌詞ドキュメント作成時の入力要件
export const createLyricSchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  text: z.string().min(1).max(20000),
  ownerName: z.string().min(1).max(100).optional()
});

// 既存歌詞更新時の入力要件（バージョン必須）
export const updateLyricSchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  text: z.string().min(1).max(20000),
  version: z.number().int().positive()
});

// アノテーションの作成／更新共通スキーマ
export const annotationSchema = z
  .object({
    start: z.number().int().nonnegative(),
    end: z.number().int().positive(),
    tag: z.string().min(1).max(50),
    comment: z.string().max(500).optional(),
    props: annotationPropsSchema
  })
  .refine((data) => data.end > data.start, {
    message: 'end must be greater than start',
    path: ['end']
  });

// 公開設定切り替え用スキーマ
export const shareSchema = z.object({
  isPublicView: z.boolean(),
  ownerName: z.string().min(1).max(100).optional()
});

// 公開歌詞一覧取得のクエリパラメータ
export const listPublicLyricsQuerySchema = z.object({
  title: z.string().max(200).optional(),
  artist: z.string().max(200).optional(),
  author: z.string().max(100).optional()
});
