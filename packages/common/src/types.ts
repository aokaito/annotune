// 共通型定義 - backend/frontendで再利用
export type AnnotationTag =
  | 'vibrato'
  | 'scoop'
  | 'fall'
  | 'slide'
  | 'hold'
  | 'breath'
  | string;

export interface AnnotationProps {
  intensity?: 'low' | 'medium' | 'high';
  length?: 'short' | 'medium' | 'long';
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
