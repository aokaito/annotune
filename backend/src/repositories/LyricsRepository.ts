// DynamoDB を操作し歌詞・アノテーションの CRUD を提供するリポジトリ。
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { nanoid } from '../utils/nanoid';
import { HttpError } from '../utils/http';
import type { AnnotationRecord, DocVersionRecord, LyricDocument } from '../types';
import type { TableConfig } from '../config/env';

// ISO 文字列の現在時刻を返すヘルパー
const now = () => new Date().toISOString();

// 二つの範囲が重なるかを判定するユーティリティ
const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
  !(aEnd <= bStart || aStart >= bEnd);

export class LyricsRepository {
  constructor(private readonly client: DynamoDBDocumentClient, private readonly config: TableConfig) {}

  async createLyric(ownerId: string, payload: { title: string; text: string }): Promise<LyricDocument> {
    const docId = nanoid();
    const timestamp = now();
    const item: LyricDocument = {
      docId,
      ownerId,
      title: payload.title,
      text: payload.text,
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      isPublicView: false
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

    await this.storeVersionSnapshot({
      docId,
      version: 1,
      title: item.title,
      text: item.text,
      createdAt: timestamp,
      authorId: ownerId
    });

    return item;
  }

  async listLyrics(ownerId: string): Promise<LyricDocument[]> {
    if (this.config.lyricsOwnerIndex) {
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
      return (result.Items ?? []) as LyricDocument[];
    }

    const scanResult = await this.client.send(
      new ScanCommand({
        TableName: this.config.lyricsTable,
        FilterExpression: 'ownerId = :ownerId',
        ExpressionAttributeValues: {
          ':ownerId': ownerId
        }
      })
    );

    return (scanResult.Items ?? []) as LyricDocument[];
  }

  async getLyric(docId: string, ownerId?: string): Promise<LyricDocument & { annotations: AnnotationRecord[] }> {
    const record = await this.client.send(
      new GetCommand({
        TableName: this.config.lyricsTable,
        Key: { docId }
      })
    );

    if (!record.Item) {
      throw new HttpError(404, 'Document not found');
    }

    const lyric = record.Item as LyricDocument;

    if (ownerId && lyric.ownerId !== ownerId) {
      throw new HttpError(403, 'Forbidden');
    }

    const annotations = await this.loadAnnotations(docId);
    // アノテーションを付加した複合オブジェクトを返す
    return { ...lyric, annotations };
  }

  async getLyricForPublic(docId: string): Promise<LyricDocument & { annotations: AnnotationRecord[] }> {
    const record = await this.client.send(
      new GetCommand({
        TableName: this.config.lyricsTable,
        Key: { docId }
      })
    );

    if (!record.Item) {
      throw new HttpError(404, 'Document not found');
    }
    const lyric = record.Item as LyricDocument;
    if (!lyric.isPublicView) {
      throw new HttpError(403, 'Document is not public');
    }
    const annotations = await this.loadAnnotations(docId);
    return { ...lyric, annotations };
  }

  async updateLyric(
    docId: string,
    ownerId: string,
    payload: { title: string; text: string; version: number }
  ): Promise<LyricDocument> {
    const timestamp = now();
    let result;
    try {
      result = await this.client.send(
        new UpdateCommand({
          TableName: this.config.lyricsTable,
          Key: { docId },
          UpdateExpression:
            'SET title = :title, #text = :text, version = version + :inc, updatedAt = :updatedAt',
          ConditionExpression: 'ownerId = :ownerId AND version = :expectedVersion',
          ExpressionAttributeNames: {
            '#text': 'text'
          },
          ExpressionAttributeValues: {
            ':ownerId': ownerId,
            ':expectedVersion': payload.version,
            ':title': payload.title,
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
    await this.storeVersionSnapshot({
      docId,
      version: updated.version,
      title: updated.title,
      text: updated.text,
      createdAt: timestamp,
      authorId: ownerId
    });

    return updated;
  }

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

  async shareLyric(docId: string, ownerId: string, isPublicView: boolean): Promise<LyricDocument> {
    let result;
    try {
      result = await this.client.send(
        new UpdateCommand({
          TableName: this.config.lyricsTable,
          Key: { docId },
          UpdateExpression: 'SET isPublicView = :isPublic, updatedAt = :updatedAt',
          ConditionExpression: 'ownerId = :ownerId',
          ExpressionAttributeValues: {
            ':ownerId': ownerId,
            ':isPublic': isPublicView,
            ':updatedAt': now()
          },
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

  async createAnnotation(
    docId: string,
    ownerId: string,
    authorId: string,
    payload: { start: number; end: number; tag: string; comment?: string; props?: Record<string, unknown> }
  ): Promise<AnnotationRecord> {
    const lyric = await this.getLyric(docId, ownerId);
    this.validateRange(payload.start, payload.end, lyric.text.length);

    if (lyric.annotations.some((ann) => overlaps(payload.start, payload.end, ann.start, ann.end))) {
      throw new HttpError(400, 'Annotation overlaps');
    }

    const timestamp = now();
    const annotation: AnnotationRecord = {
      docId,
      annotationId: nanoid(),
      start: payload.start,
      end: payload.end,
      tag: payload.tag,
      comment: payload.comment,
      props: payload.props,
      authorId,
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1
    };

    try {
      await this.client.send(
        new PutCommand({
          TableName: this.config.annotationsTable,
          Item: annotation,
          ConditionExpression: 'attribute_not_exists(annotationId)'
        })
      );
    } catch (error) {
      // 同じ ID が存在するケースは理論上少ないが 409 を返す
      this.handleConditionalError(error, 'Annotation already exists');
    }

    return annotation;
  }

  async updateAnnotation(
    docId: string,
    ownerId: string,
    annotationId: string,
    payload: { start: number; end: number; tag: string; comment?: string; props?: Record<string, unknown> }
  ): Promise<AnnotationRecord> {
    const lyric = await this.getLyric(docId, ownerId);
    this.validateRange(payload.start, payload.end, lyric.text.length);

    if (
      lyric.annotations.some(
        (ann) => ann.annotationId !== annotationId && overlaps(payload.start, payload.end, ann.start, ann.end)
      )
    ) {
      throw new HttpError(400, 'Annotation overlaps');
    }

    const timestamp = now();
    let result;
    try {
      result = await this.client.send(
        new UpdateCommand({
          TableName: this.config.annotationsTable,
          Key: { docId, annotationId },
          UpdateExpression:
            'SET #start = :start, #end = :end, tag = :tag, comment = :comment, props = :props, updatedAt = :updatedAt, version = version + :inc',
          ConditionExpression: 'attribute_exists(annotationId)',
          ExpressionAttributeNames: {
            '#start': 'start',
            '#end': 'end'
          },
          ExpressionAttributeValues: {
            ':start': payload.start,
            ':end': payload.end,
            ':tag': payload.tag,
            ':comment': payload.comment,
            ':props': payload.props,
            ':updatedAt': timestamp,
            ':inc': 1
          },
          ReturnValues: 'ALL_NEW'
        })
      );
    } catch (error) {
      this.handleConditionalError(error, 'Annotation not found', 404);
    }

    if (!result.Attributes) {
      // 条件付き更新が成功しても Attributes が無い場合は存在しなかったとみなす
      throw new HttpError(404, 'Annotation not found');
    }

    return result.Attributes as AnnotationRecord;
  }

  async deleteAnnotation(docId: string, ownerId: string, annotationId: string): Promise<void> {
    // 所有者チェックのみ実施し、その後削除
    await this.getLyric(docId, ownerId);
    await this.client.send(
      new DeleteCommand({
        TableName: this.config.annotationsTable,
        Key: { docId, annotationId }
      })
    );
  }

  async listVersions(docId: string, ownerId: string): Promise<DocVersionRecord[]> {
    await this.ensureOwner(docId, ownerId);
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.config.versionsTable,
        KeyConditionExpression: 'docId = :docId',
        ExpressionAttributeValues: {
          ':docId': docId
        },
        ScanIndexForward: false
      })
    );

    return (result.Items ?? []) as DocVersionRecord[];
  }

  async getVersion(docId: string, version: number, ownerId: string): Promise<DocVersionRecord> {
    await this.ensureOwner(docId, ownerId);
    const result = await this.client.send(
      new GetCommand({
        TableName: this.config.versionsTable,
        Key: { docId, version }
      })
    );

    if (!result.Item) {
      throw new HttpError(404, 'Version not found');
    }

    return result.Item as DocVersionRecord;
  }

  private async loadAnnotations(docId: string): Promise<AnnotationRecord[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.config.annotationsTable,
        KeyConditionExpression: 'docId = :docId',
        ExpressionAttributeValues: {
          ':docId': docId
        }
      })
    );

    return (result.Items ?? []) as AnnotationRecord[];
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
      throw new HttpError(404, 'Document not found');
    }
    if (record.Item.ownerId !== ownerId) {
      // 所有者と異なる場合は編集権限なし
      throw new HttpError(403, 'Forbidden');
    }
  }

  private async storeVersionSnapshot(snapshot: DocVersionRecord): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.config.versionsTable,
        Item: snapshot
      })
    );
  }

  private validateRange(start: number, end: number, textLength: number) {
    if (start < 0 || end > textLength || start >= end) {
      throw new HttpError(400, 'Invalid annotation range');
    }
  }

  private handleConditionalError(error: unknown, message: string, statusCode = 409): never {
    if (error instanceof ConditionalCheckFailedException || (error as { name?: string })?.name === 'ConditionalCheckFailedException') {
      throw new HttpError(statusCode, message);
    }
    throw error;
  }
}
