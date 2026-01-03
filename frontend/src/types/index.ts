// フロントエンドで利用する共通型定義。
export type AnnotationTag =
  | 'vibrato'
  | 'scoop'
  | 'fall'
  | 'slide'
  | 'hold'
  | 'breath'
  | string;

// アノテーション機能で使う追加プロパティ（強さ・長さなど任意フィールド）
export interface AnnotationProps {
  intensity?: 'low' | 'medium' | 'high';
  length?: 'short' | 'medium' | 'long';
  [key: string]: unknown;
}

// テキスト上に付与されたアノテーション 1 件を表す
export interface Annotation {
  annotationId: string;
  start: number;
  end: number;
  tag: AnnotationTag;
  comment?: string;
  props?: AnnotationProps;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

// 歌詞ドキュメント本体。編集画面で扱う主要データ
export interface LyricDocument {
  docId: string;
  ownerId: string;
  ownerName?: string;
  title: string;
  artist: string;
  text: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  isPublicView: boolean;
  annotations: Annotation[];
}

// バージョン履歴に保存される歌詞のスナップショット
export interface LyricVersionSnapshot {
  docId: string;
  version: number;
  title: string;
  artist: string;
  text: string;
  createdAt: string;
  authorId: string;
}
