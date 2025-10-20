// このファイルでは API 入力を検証する zod スキーマを定義する。
import { z } from 'zod';

// アノテーションに付随する任意プロパティ
export const annotationPropsSchema = z
  .object({
    intensity: z.enum(['low', 'medium', 'high']).optional(),
    length: z.enum(['short', 'medium', 'long']).optional()
  })
  .catchall(z.unknown())
  .optional();

// 新規歌詞ドキュメント作成時の入力要件
export const createLyricSchema = z.object({
  title: z.string().min(1).max(200),
  text: z.string().min(1).max(20000)
});

// 既存歌詞更新時の入力要件（バージョン必須）
export const updateLyricSchema = z.object({
  title: z.string().min(1).max(200),
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
  isPublicView: z.boolean()
});
