// バックエンドで再利用するドメイン型定義。
import type { AnnotationTag, AnnotationProps, BaseLyricDocument, BaseAnnotation, BaseLyricVersionSnapshot, BaseUserProfile } from '@annotune/common';

export type { AnnotationTag, AnnotationProps };

export interface LyricDocument extends BaseLyricDocument {}

export interface AnnotationRecord extends BaseAnnotation {
  docId: string;
  ownerId: string;
  version: number;
}

export interface DocVersionRecord extends BaseLyricVersionSnapshot {
  ownerId: string;
}

export interface UserProfile extends BaseUserProfile {}

export interface AnnotuneUser {
  userId: string;
  displayName?: string;
}
