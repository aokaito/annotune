// バックエンドで再利用するドメイン型定義。
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

export interface LyricDocument {
  docId: string;
  ownerId: string;
  title: string;
  text: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  isPublicView: boolean;
}

export interface AnnotationRecord {
  docId: string;
  annotationId: string;
  start: number;
  end: number;
  tag: AnnotationTag;
  comment?: string;
  props?: AnnotationProps;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface DocVersionRecord {
  docId: string;
  version: number;
  title: string;
  text: string;
  createdAt: string;
  authorId: string;
}

export interface AnnotuneUser {
  userId: string;
  displayName?: string;
}
