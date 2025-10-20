// フロントエンドで利用する共通型定義。
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

export interface LyricDocument {
  docId: string;
  ownerId: string;
  title: string;
  text: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  isPublicView: boolean;
  annotations: Annotation[];
}

export interface LyricVersionSnapshot {
  docId: string;
  version: number;
  title: string;
  text: string;
  createdAt: string;
  authorId: string;
}
