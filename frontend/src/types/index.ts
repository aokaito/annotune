// フロントエンドで利用する共通型定義。
import type { AnnotationTag, AnnotationProps, BaseLyricDocument, BaseAnnotation, BaseLyricVersionSnapshot } from '@annotune/common';

export type { AnnotationTag, AnnotationProps };

// テキスト上に付与されたアノテーション 1 件を表す
export interface Annotation extends BaseAnnotation {}

// 歌詞ドキュメント本体。編集画面で扱う主要データ
export interface LyricDocument extends BaseLyricDocument {
  annotations: Annotation[];
}

// バージョン履歴に保存される歌詞のスナップショット
export interface LyricVersionSnapshot extends BaseLyricVersionSnapshot {}
