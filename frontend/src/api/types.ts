import type { Annotation, LyricDocument, LyricVersionSnapshot } from '../types';

export interface CreateLyricPayload {
  title: string;
  artist?: string;
  text: string;
  ownerName?: string;
}

export interface UpdateLyricPayload {
  title: string;
  artist?: string;
  text: string;
  version: number;
}

export interface AnnotationPayload {
  start: number;
  end: number;
  tag: Annotation['tag'];
  comment?: string;
  props?: Annotation['props'];
}

export interface AnnotuneApi {
  listLyrics(ownerId: string): Promise<LyricDocument[]>;
  createLyric(ownerId: string, payload: CreateLyricPayload): Promise<LyricDocument>;
  getLyric(docId: string): Promise<LyricDocument | undefined>;
  getPublicLyric(docId: string): Promise<LyricDocument | undefined>;
  searchPublicLyrics(query?: {
    title?: string;
    artist?: string;
    author?: string;
  }): Promise<LyricDocument[]>;
  updateLyric(docId: string, payload: UpdateLyricPayload): Promise<LyricDocument>;
  deleteLyric(docId: string): Promise<void>;
  shareLyric(docId: string, isPublicView: boolean): Promise<LyricDocument>;
  createAnnotation(docId: string, authorId: string, payload: AnnotationPayload): Promise<Annotation>;
  updateAnnotation(
    docId: string,
    annotationId: string,
    payload: AnnotationPayload
  ): Promise<Annotation>;
  deleteAnnotation(docId: string, annotationId: string): Promise<void>;
  listVersions(docId: string): Promise<LyricVersionSnapshot[]>;
  getVersion(docId: string, version: number): Promise<LyricVersionSnapshot | undefined>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
