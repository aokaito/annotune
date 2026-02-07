// 共通型定義 - backend/frontendで再利用

// エフェクト種別
export type EffectTag = 'vibrato' | 'scoop' | 'fall' | 'breath';

// 声質種別
export type VoiceQualityTag = 'whisper' | 'edge' | 'falsetto';

// アノテーションタグ（エフェクト、声質、またはコメントのみ）
export type AnnotationTag =
  | EffectTag
  | VoiceQualityTag
  | 'comment'
  | string;

export interface AnnotationProps {
  voiceQuality?: VoiceQualityTag;
  [key: string]: unknown;
}

export interface BaseLyricDocument {
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
}

export interface BaseAnnotation {
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

export interface BaseLyricVersionSnapshot {
  docId: string;
  version: number;
  title: string;
  artist: string;
  text: string;
  createdAt: string;
  authorId: string;
}
