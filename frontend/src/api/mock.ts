// フロントエンド開発時に利用するインメモリのモック API 実装。
import { nanoid } from '../utils/nanoid';
import type { Annotation, LyricDocument, LyricVersionSnapshot } from '../types';
import type { AnnotuneApi, AnnotationPayload, CreateLyricPayload, UpdateLyricPayload } from './types';

interface MockDatabase {
  lyrics: Map<string, LyricDocument>;
  versions: Map<string, LyricVersionSnapshot[]>;
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
    ownerName: 'デモユーザー',
    title: '夜空ノムコウ',
    artist: 'SMAP',
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
            artist: lyric.artist,
            text: lyric.text,
            createdAt: lyric.createdAt,
            authorId: ownerId
          }
        ]
      ]
    ])
  };
};

const cloneAnnotation = (annotation: Annotation): Annotation => ({
  annotationId: annotation.annotationId,
  start: annotation.start,
  end: annotation.end,
  tag: annotation.tag,
  comment: annotation.comment,
  props: annotation.props,
  authorId: annotation.authorId,
  createdAt: annotation.createdAt,
  updatedAt: annotation.updatedAt
});

export const createMockApi = (ownerId: string): AnnotuneApi => {
  // マップ構造を使って疑似的な永続化を再現
  const db = createSeedData(ownerId);

  const touch = (lyric: LyricDocument): LyricDocument => ({
    ...lyric,
    annotations: lyric.annotations.map(cloneAnnotation)
  });

  return {
    // ドキュメント一覧を取得する（ダッシュボードで使用）
    async listLyrics(requestOwnerId) {
      return [...db.lyrics.values()]
        .filter((lyric) => lyric.ownerId === requestOwnerId)
        .map(touch);
    },
    // 新しい歌詞ドキュメントを作成する
    async createLyric(requestOwnerId: string, payload: CreateLyricPayload) {
      const docId = nanoid();
      const now = new Date().toISOString();
      const lyric: LyricDocument = {
        docId,
        ownerId: requestOwnerId,
        ownerName: 'デモユーザー',
        title: payload.title,
        artist: payload.artist ?? '',
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
          artist: lyric.artist,
          text: lyric.text,
          createdAt: now,
          authorId: requestOwnerId
        }
      ]);
      return touch(lyric);
    },
    // 個別の歌詞ドキュメントを取得する
    async getLyric(docId) {
      const item = db.lyrics.get(docId);
      if (!item) {
        return undefined;
      }
      return touch(item);
    },
    async getPublicLyric(docId) {
      const item = db.lyrics.get(docId);
      if (!item || !item.isPublicView) {
        return undefined;
      }
      return touch(item);
    },
    async searchPublicLyrics(query) {
      const entries = [...db.lyrics.values()].filter((lyric) => lyric.isPublicView);
      const matches = (value: string, filter?: string) =>
        !filter ? true : value.toLowerCase().includes(filter.toLowerCase());
      const filtered = entries.filter(
        (lyric) =>
          matches(lyric.title, query?.title) &&
          matches(lyric.artist, query?.artist) &&
          matches(lyric.ownerName ?? '', query?.author)
      );
      return filtered.map(touch);
    },
    // 歌詞ドキュメントを更新し、バージョンを 1 進める
    async updateLyric(docId: string, payload: UpdateLyricPayload) {
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
        artist: payload.artist ?? existing.artist,
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
        artist: updated.artist,
        text: updated.text,
        createdAt: updated.updatedAt,
        authorId: existing.ownerId
      });
      db.versions.set(docId, snapshots);
      return touch(updated);
    },
    // 歌詞ドキュメントを完全に削除する
    async deleteLyric(docId) {
      db.lyrics.delete(docId);
      db.versions.delete(docId);
    },
    // 公開／非公開の状態を切り替える
    async shareLyric(docId, isPublicView) {
      const existing = db.lyrics.get(docId);
      if (!existing) {
        throw new Error('Lyric not found');
      }
      const updated = { ...existing, isPublicView, updatedAt: new Date().toISOString() };
      db.lyrics.set(docId, updated);
      return touch(updated);
    },
    // 新しいアノテーションを追加する
    async createAnnotation(docId: string, authorId: string, payload: AnnotationPayload) {
      const existing = db.lyrics.get(docId);
      if (!existing) {
        throw new Error('Lyric not found');
      }
      clampRange(existing.text, payload.start, payload.end);
      if (
        existing.annotations.some((ann) => !(payload.end <= ann.start || payload.start >= ann.end))
      ) {
        throw new Error('Annotation overlaps with existing range');
      }
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
      const updated: LyricDocument = {
        ...existing,
        annotations: [...existing.annotations, annotation],
        updatedAt: annotation.updatedAt
      };
      db.lyrics.set(docId, updated);
      return cloneAnnotation(annotation);
    },
    // 既存のアノテーションを編集する
    async updateAnnotation(docId: string, annotationId: string, payload: AnnotationPayload) {
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
      const target = annotations.find((ann) => ann.annotationId === annotationId);
      if (!target) {
        throw new Error('Annotation not found');
      }
      return cloneAnnotation(target);
    },
    // 指定したアノテーションを削除する
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
    },
    // バージョン一覧を新しい順に取得する
    async listVersions(docId) {
      return [...(db.versions.get(docId) ?? [])].sort((a, b) => b.version - a.version);
    },
    // 指定バージョン番号のスナップショットを取得する
    async getVersion(docId, version) {
      return (db.versions.get(docId) ?? []).find((snap) => snap.version === version);
    }
  };
};

// この MVP フェーズの動作確認用にデフォルトユーザーのモック API をエクスポート
export const mockApi = createMockApi('demo-user');
