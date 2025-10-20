// フロントエンド開発時に利用するインメモリのモック API 実装。
import { nanoid } from '../utils/nanoid';
import type { Annotation, LyricDocument, LyricVersionSnapshot } from '../types';

// 各 API エンドポイントに対応するリクエストペイロード型
export interface CreateLyricPayload {
  title: string;
  text: string;
}

export interface UpdateLyricPayload {
  title: string;
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

interface MockDatabase {
  lyrics: Map<string, LyricDocument>;
  versions: Map<string, LyricVersionSnapshot[]>;
}

// フロントエンドが利用する API インターフェース
export interface AnnotuneApi {
  listLyrics(ownerId: string): Promise<LyricDocument[]>;
  createLyric(ownerId: string, payload: CreateLyricPayload): Promise<LyricDocument>;
  getLyric(docId: string): Promise<LyricDocument | undefined>;
  updateLyric(docId: string, payload: UpdateLyricPayload): Promise<LyricDocument>;
  deleteLyric(docId: string): Promise<void>;
  shareLyric(docId: string, isPublicView: boolean): Promise<LyricDocument>;
  createAnnotation(docId: string, authorId: string, payload: AnnotationPayload): Promise<LyricDocument>;
  updateAnnotation(
    docId: string,
    annotationId: string,
    payload: AnnotationPayload
  ): Promise<LyricDocument>;
  deleteAnnotation(docId: string, annotationId: string): Promise<LyricDocument>;
  listVersions(docId: string): Promise<LyricVersionSnapshot[]>;
  getVersion(docId: string, version: number): Promise<LyricVersionSnapshot | undefined>;
}

// 範囲が歌詞の長さを超えたり逆転していないか検証
const clampRange = (text: string, start: number, end: number) => {
  if (start < 0 || end > text.length || start >= end) {
    throw new Error('Invalid annotation range');
  }
};

// デモ用の初期データを生成
const createSeedData = (ownerId: string): MockDatabase => {
  const lyric: LyricDocument = {
    docId: 'demo-doc',
    ownerId,
    title: '夜空ノムコウ',
    text: `あれから ぼくたちは
何かを信じてこれたかな
夜空の向こうには
明日がもう待っている`,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPublicView: true,
    annotations: [
      {
        annotationId: 'ann-1',
        start: 4,
        end: 8,
        tag: 'vibrato',
        comment: '語尾を柔らかく揺らす',
        props: { intensity: 'medium' },
        authorId: ownerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  };
  return {
    lyrics: new Map([[lyric.docId, lyric]]),
    versions: new Map([
      [
        lyric.docId,
        [
          {
            docId: lyric.docId,
            version: 1,
            title: lyric.title,
            text: lyric.text,
            createdAt: lyric.createdAt,
            authorId: ownerId
          }
        ]
      ]
    ])
  };
};

export const createMockApi = (ownerId: string): AnnotuneApi => {
  // Map を使って疑似的な永続化を再現
  const db = createSeedData(ownerId);

  return {
    async listLyrics(requestOwnerId) {
      // オーナー一致のドキュメントのみ返却
      return [...db.lyrics.values()].filter((lyric) => lyric.ownerId === requestOwnerId);
    },
    async createLyric(requestOwnerId, payload) {
      const docId = nanoid();
      const now = new Date().toISOString();
      const lyric: LyricDocument = {
        docId,
        ownerId: requestOwnerId,
        title: payload.title,
        text: payload.text,
        version: 1,
        createdAt: now,
        updatedAt: now,
        isPublicView: false,
        annotations: []
      };
      db.lyrics.set(docId, lyric);
      db.versions.set(docId, [
        {
          docId,
          version: 1,
          title: lyric.title,
          text: lyric.text,
          createdAt: now,
          authorId: requestOwnerId
        }
      ]);
      return lyric;
    },
    async getLyric(docId) {
      return db.lyrics.get(docId);
    },
    async updateLyric(docId, payload) {
      const existing = db.lyrics.get(docId);
      if (!existing) {
        throw new Error('Lyric not found');
      }
      if (existing.version !== payload.version) {
        // バージョンがずれている場合は楽観ロックエラーとする
        throw new Error('Version conflict');
      }
      const nextVersion = existing.version + 1;
      const updated: LyricDocument = {
        ...existing,
        title: payload.title,
        text: payload.text,
        version: nextVersion,
        updatedAt: new Date().toISOString()
      };
      db.lyrics.set(docId, updated);
      const snapshots = db.versions.get(docId) ?? [];
      snapshots.push({
        docId,
        version: nextVersion,
        title: updated.title,
        text: updated.text,
        createdAt: updated.updatedAt,
        authorId: existing.ownerId
      });
      db.versions.set(docId, snapshots);
      return updated;
    },
    async deleteLyric(docId) {
      db.lyrics.delete(docId);
      db.versions.delete(docId);
    },
    async shareLyric(docId, isPublicView) {
      const existing = db.lyrics.get(docId);
      if (!existing) {
        throw new Error('Lyric not found');
      }
      const updated = { ...existing, isPublicView, updatedAt: new Date().toISOString() };
      db.lyrics.set(docId, updated);
      return updated;
    },
    async createAnnotation(docId, authorId, payload) {
      const existing = db.lyrics.get(docId);
      if (!existing) {
        throw new Error('Lyric not found');
      }
      clampRange(existing.text, payload.start, payload.end);
      const annotation: Annotation = {
        annotationId: nanoid(),
        start: payload.start,
        end: payload.end,
        tag: payload.tag,
        comment: payload.comment,
        props: payload.props,
        authorId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (
        existing.annotations.some(
          (ann) => !(payload.end <= ann.start || payload.start >= ann.end)
        )
      ) {
        // 範囲が既存アノテーションと重複する場合は弾く
        throw new Error('Annotation overlaps with existing range');
      }
      const updated: LyricDocument = {
        ...existing,
        annotations: [...existing.annotations, annotation],
        updatedAt: annotation.updatedAt
      };
      db.lyrics.set(docId, updated);
      return updated;
    },
    async updateAnnotation(docId, annotationId, payload) {
      const existing = db.lyrics.get(docId);
      if (!existing) {
        throw new Error('Lyric not found');
      }
      clampRange(existing.text, payload.start, payload.end);
      if (
        existing.annotations.some(
          (ann) =>
            ann.annotationId !== annotationId &&
            !(payload.end <= ann.start || payload.start >= ann.end)
        )
      ) {
        throw new Error('Annotation overlaps with existing range');
      }
      const annotations = existing.annotations.map((ann) =>
        ann.annotationId === annotationId
          ? {
              ...ann,
              start: payload.start,
              end: payload.end,
              tag: payload.tag,
              comment: payload.comment,
              props: payload.props,
              updatedAt: new Date().toISOString()
            }
          : ann
      );
      const updated: LyricDocument = {
        ...existing,
        annotations,
        updatedAt: new Date().toISOString()
      };
      db.lyrics.set(docId, updated);
      return updated;
    },
    async deleteAnnotation(docId, annotationId) {
      const existing = db.lyrics.get(docId);
      if (!existing) {
        throw new Error('Lyric not found');
      }
      const annotations = existing.annotations.filter((ann) => ann.annotationId !== annotationId);
      const updated: LyricDocument = {
        ...existing,
        annotations,
        updatedAt: new Date().toISOString()
      };
      db.lyrics.set(docId, updated);
      return updated;
    },
    async listVersions(docId) {
      return [...(db.versions.get(docId) ?? [])].sort((a, b) => b.version - a.version);
    },
    async getVersion(docId, version) {
      return (db.versions.get(docId) ?? []).find((snap) => snap.version === version);
    }
  };
};

// For MVP scaffolding we expose a default mock implementation.
export const mockApi = createMockApi('demo-user');
