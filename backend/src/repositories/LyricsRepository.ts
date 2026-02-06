import { DynamoDBDocumentClient, DeleteCommand, GetCommand, PutCommand, QueryCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { NotFoundError } from '../utils/errors';
import { nanoid } from '@annotune/common';
import { HttpError } from '../utils/http';
import type { AnnotationRecord, DocVersionRecord, LyricDocument } from '../types';
import type { TableConfig } from '../config/env';
import { AnnotationsRepository } from './AnnotationsRepository';
import { VersionsRepository } from './VersionsRepository';

// 現在時刻を ISO 形式の文字列で返すヘルパ
const now = () => new Date().toISOString();

const normalizeLyricRecord = (record: Partial<LyricDocument>): LyricDocument => ({
  ...(record as LyricDocument),
  artist: record.artist ?? '',
  ownerName: record.ownerName ?? ''
});

export class LyricsRepository {
  private readonly annotationsRepo: AnnotationsRepository;
  private readonly versionsRepo: VersionsRepository;

  constructor(private readonly client: DynamoDBDocumentClient, private readonly config: TableConfig) {
    this.annotationsRepo = new AnnotationsRepository(client, config);
    this.versionsRepo = new VersionsRepository(client, config);
  }

  // 歌詞ドキュメントを新規作成し、初回のバージョンスナップショットも保存する
  async createLyric(
    ownerId: string,
    payload: { title: string; artist: string; text: string; ownerName?: string }
  ): Promise<LyricDocument> {
    const docId = nanoid();
    const timestamp = now();
    const item: LyricDocument & { publicStatus: string } = {
      docId,
      ownerId,
      ownerName: payload.ownerName,
      title: payload.title,
      artist: payload.artist,
      text: payload.text,
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      isPublicView: false,
      publicStatus: 'private'
    };

    try {
      await this.client.send(
        new PutCommand({
          TableName: this.config.lyricsTable,
          Item: item,
          ConditionExpression: 'attribute_not_exists(docId)'
        })
      );
    } catch (error) {
      // 条件付き書き込みが失敗した場合は 409 を投げる
      this.handleConditionalError(error, 'Document already exists');
    }

    await this.versionsRepo.storeVersionSnapshot({
      docId,
      version: 1,
      title: item.title,
      artist: item.artist,
      text: item.text,
      createdAt: timestamp,
      authorId: ownerId,
      ownerId
    });

    return item;
  }

  // 所有者ごとの歌詞一覧を取得する
  async listLyrics(ownerId: string): Promise<LyricDocument[]> {
    if (this.config.lyricsOwnerIndex) {
      // グローバルセカンダリインデックス（ownerId-index）がある場合は Query で高速に取得
      const result = await this.client.send(
        new QueryCommand({
          TableName: this.config.lyricsTable,
          IndexName: this.config.lyricsOwnerIndex,
          KeyConditionExpression: 'ownerId = :ownerId',
          ExpressionAttributeValues: {
            ':ownerId': ownerId
          }
        })
      );
      return (result.Items ?? []).map((item) => normalizeLyricRecord(item as LyricDocument));
    }

    // グローバルセカンダリインデックスが無い場合は全件走査してフィルタする（少量データ前提）
    const scanResult = await this.client.send(
      new ScanCommand({
        TableName: this.config.lyricsTable,
        FilterExpression: 'ownerId = :ownerId',
        ExpressionAttributeValues: {
          ':ownerId': ownerId
        }
      })
    );

    return (scanResult.Items ?? []).map((item) => normalizeLyricRecord(item as LyricDocument));
  }

  // ドキュメントと関連アノテーションを取得する（所有者チェックは任意）
  async getLyric(docId: string, ownerId?: string): Promise<LyricDocument & { annotations: AnnotationRecord[] }> {
    const record = await this.client.send(
      new GetCommand({
        TableName: this.config.lyricsTable,
        Key: { docId }
      })
    );

    if (!record.Item) {
      throw new NotFoundError('Document not found');
    }

    const lyric = normalizeLyricRecord(record.Item as LyricDocument);

    if (ownerId && lyric.ownerId !== ownerId) {
      throw new HttpError(403, 'Forbidden');
    }

    const annotations = await this.annotationsRepo.loadAnnotations(docId, lyric.ownerId);
    // アノテーションを付加した複合オブジェクトを返す
    return { ...lyric, annotations };
  }

  // 公開設定が有効なドキュメントを取得する
  async getLyricForPublic(docId: string): Promise<LyricDocument & { annotations: AnnotationRecord[] }> {
    const record = await this.client.send(
      new GetCommand({
        TableName: this.config.lyricsTable,
        Key: { docId }
      })
    );
    if (!record.Item) {
      throw new NotFoundError('Document not found');
    }
    const lyric = normalizeLyricRecord(record.Item as LyricDocument);
    if (!lyric.isPublicView) {
      // 公開フラグが false の場合は閲覧を禁止
      throw new HttpError(403, 'Document is not public');
    }
    // ownerNameがownerIdと同じ場合（アカウントIDがそのまま保存されている場合）はundefinedにする
    const normalizedOwnerName = lyric.ownerName && lyric.ownerName !== lyric.ownerId ? lyric.ownerName : undefined;
    const annotations = await this.annotationsRepo.loadAnnotations(docId, lyric.ownerId);
    return { ...lyric, ownerName: normalizedOwnerName, annotations };
  }

  async listPublicLyrics(filters?: {
    title?: string;
    artist?: string;
    author?: string;
  }): Promise<LyricDocument[]> {
    let items: LyricDocument[];

    if (this.config.lyricsPublicStatusIndex) {
      // GSI(publicStatus-index)がある場合はQueryで高速に取得
      const queryResult = await this.client.send(
        new QueryCommand({
          TableName: this.config.lyricsTable,
          IndexName: this.config.lyricsPublicStatusIndex,
          KeyConditionExpression: 'publicStatus = :publicStatus',
          ExpressionAttributeValues: {
            ':publicStatus': 'public'
          }
        })
      );
      items = (queryResult.Items ?? []).map((item) => {
        const lyric = normalizeLyricRecord(item as LyricDocument);
        const normalizedOwnerName = lyric.ownerName && lyric.ownerName !== lyric.ownerId ? lyric.ownerName : undefined;
        return { ...lyric, ownerName: normalizedOwnerName };
      });
    } else {
      // GSIがない場合はScanでフォールバック（後方互換性のため）
      const scanResult = await this.client.send(
        new ScanCommand({
          TableName: this.config.lyricsTable,
          FilterExpression: 'isPublicView = :public',
          ExpressionAttributeValues: {
            ':public': true
          }
        })
      );
      items = (scanResult.Items ?? []).map((item) => {
        const lyric = normalizeLyricRecord(item as LyricDocument);
        const normalizedOwnerName = lyric.ownerName && lyric.ownerName !== lyric.ownerId ? lyric.ownerName : undefined;
        return { ...lyric, ownerName: normalizedOwnerName };
      });
    }

    if (!filters || (!filters.title && !filters.artist && !filters.author)) {
      return items;
    }

    const matches = (value: string, filter?: string) =>
      !filter || filter.length === 0
        ? true
        : value.toLowerCase().includes(filter.toLowerCase());

    return items.filter(
      (item) =>
        matches(item.title, filters.title) &&
        matches(item.artist, filters.artist) &&
        matches(item.ownerName ?? '', filters.author)
    );
  }

  // 歌詞本文とタイトルを更新し、バージョンを進める
  async updateLyric(
    docId: string,
    ownerId: string,
    payload: { title: string; artist: string; text: string; version: number }
  ): Promise<LyricDocument> {
    const timestamp = now();
    let result;
    try {
      result = await this.client.send(
        new UpdateCommand({
          TableName: this.config.lyricsTable,
          Key: { docId },
          UpdateExpression:
            'SET title = :title, artist = :artist, #text = :text, version = version + :inc, updatedAt = :updatedAt',
          ConditionExpression: 'ownerId = :ownerId AND version = :expectedVersion',
          ExpressionAttributeNames: {
            '#text': 'text'
          },
          ExpressionAttributeValues: {
            ':ownerId': ownerId,
            ':expectedVersion': payload.version,
            ':title': payload.title,
            ':artist': payload.artist,
            ':text': payload.text,
            ':updatedAt': timestamp,
            ':inc': 1
          },
          ReturnValues: 'ALL_NEW'
        })
      );
    } catch (error) {
      // バージョン不一致または権限不足
      this.handleConditionalError(error, 'Version conflict or forbidden', 409);
    }

    if (!result.Attributes) {
      throw new HttpError(500, 'Update failed');
    }

    const updated = result.Attributes as LyricDocument;

    // バージョンスナップショットを保存して履歴を残す
    await this.versionsRepo.storeVersionSnapshot({
      docId,
      version: updated.version,
      title: updated.title,
      artist: updated.artist,
      text: updated.text,
      createdAt: timestamp,
      authorId: ownerId,
      ownerId
    });

    return updated;
  }

  // 歌詞ドキュメントを削除する（所有者のみ）
  async deleteLyric(docId: string, ownerId: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteCommand({
          TableName: this.config.lyricsTable,
          Key: { docId },
          ConditionExpression: 'ownerId = :ownerId',
          ExpressionAttributeValues: {
            ':ownerId': ownerId
          }
        })
      );
    } catch (error) {
      this.handleConditionalError(error, 'Forbidden', 403);
    }
  }

  // 公開／非公開フラグを切り替える
  async shareLyric(docId: string, ownerId: string, isPublicView: boolean, ownerName?: string): Promise<LyricDocument> {
    let result;
    try {
      const publicStatus = isPublicView ? 'public' : 'private';
      const updateExpression = ownerName
        ? 'SET isPublicView = :isPublic, publicStatus = :publicStatus, ownerName = :ownerName, updatedAt = :updatedAt'
        : 'SET isPublicView = :isPublic, publicStatus = :publicStatus, updatedAt = :updatedAt';
      const expressionAttributeValues: Record<string, unknown> = {
        ':ownerId': ownerId,
        ':isPublic': isPublicView,
        ':publicStatus': publicStatus,
        ':updatedAt': now()
      };
      if (ownerName) {
        expressionAttributeValues[':ownerName'] = ownerName;
      }

      result = await this.client.send(
        new UpdateCommand({
          TableName: this.config.lyricsTable,
          Key: { docId },
          UpdateExpression: updateExpression,
          ConditionExpression: 'ownerId = :ownerId',
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: 'ALL_NEW'
        })
      );
    } catch (error) {
      this.handleConditionalError(error, 'Forbidden', 403);
    }

    if (!result.Attributes) {
      throw new HttpError(500, 'Share toggle failed');
    }

    return result.Attributes as LyricDocument;
  }

  // 新しいアノテーションを登録する
  async createAnnotation(
    docId: string,
    ownerId: string,
    authorId: string,
    payload: { start: number; end: number; tag: string; comment?: string; props?: Record<string, unknown> }
  ): Promise<AnnotationRecord> {
    const lyric = await this.getLyric(docId, ownerId);
    return this.annotationsRepo.createAnnotation(
      docId,
      ownerId,
      authorId,
      payload,
      lyric.text.length,
      lyric.annotations
    );
  }

  // 既存アノテーションを編集する
  async updateAnnotation(
    docId: string,
    ownerId: string,
    annotationId: string,
    payload: { start: number; end: number; tag: string; comment?: string; props?: Record<string, unknown> }
  ): Promise<AnnotationRecord> {
    const lyric = await this.getLyric(docId, ownerId);
    return this.annotationsRepo.updateAnnotation(
      docId,
      ownerId,
      annotationId,
      payload,
      lyric.text.length,
      lyric.annotations
    );
  }

  async deleteAnnotation(docId: string, ownerId: string, annotationId: string): Promise<void> {
    // 所有者チェックのみ実施し、その後削除
    await this.getLyric(docId, ownerId);
    await this.annotationsRepo.deleteAnnotation(docId, ownerId, annotationId);
  }

  // バージョン履歴を取得（新しい順）
  async listVersions(docId: string, ownerId: string): Promise<DocVersionRecord[]> {
    await this.ensureOwner(docId, ownerId);
    return this.versionsRepo.listVersions(docId, ownerId);
  }

  // 指定バージョンのスナップショットを取得する
  async getVersion(docId: string, version: number, ownerId: string): Promise<DocVersionRecord> {
    await this.ensureOwner(docId, ownerId);
    return this.versionsRepo.getVersion(docId, version, ownerId);
  }

  private async ensureOwner(docId: string, ownerId: string): Promise<void> {
    const record = await this.client.send(
      new GetCommand({
        TableName: this.config.lyricsTable,
        Key: { docId },
        ProjectionExpression: 'docId, ownerId'
      })
    );
    if (!record.Item) {
      throw new NotFoundError('Document not found');
    }
    if (record.Item.ownerId !== ownerId) {
      // 所有者と異なる場合は編集権限なし
      throw new HttpError(403, 'Forbidden');
    }
  }

  private handleConditionalError(error: unknown, message: string, statusCode = 409): never {
    if (error instanceof ConditionalCheckFailedException || (error as { name?: string })?.name === 'ConditionalCheckFailedException') {
      if (statusCode === 404) {
        throw new NotFoundError(message);
      }
      throw new HttpError(statusCode, message);
    }
    throw error;
  }
}
