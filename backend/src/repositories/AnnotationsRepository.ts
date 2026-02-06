import { DynamoDBDocumentClient, DeleteCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { NotFoundError } from '../utils/errors';
import { nanoid } from '@annotune/common';
import { HttpError } from '../utils/http';
import type { AnnotationRecord } from '../types';
import type { TableConfig } from '../config/env';

// 現在時刻を ISO 形式の文字列で返すヘルパ
const now = () => new Date().toISOString();

// 二つの範囲が重なるかを判定するユーティリティ
const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
  !(aEnd <= bStart || aStart >= bEnd);

const normalizeAnnotationRecord = (record: Partial<AnnotationRecord>): AnnotationRecord => ({
  ...(record as AnnotationRecord),
  ownerId: record.ownerId ?? ''
});

export class AnnotationsRepository {
  constructor(private readonly client: DynamoDBDocumentClient, private readonly config: TableConfig) {}

  // ドキュメントに紐づくアノテーション一覧を取得
  async loadAnnotations(docId: string, ownerId?: string): Promise<AnnotationRecord[]> {
    const queryInput: {
      TableName: string;
      KeyConditionExpression: string;
      ExpressionAttributeValues: Record<string, unknown>;
      FilterExpression?: string;
    } = {
      TableName: this.config.annotationsTable,
      KeyConditionExpression: 'docId = :docId',
      ExpressionAttributeValues: {
        ':docId': docId
      }
    };

    if (ownerId) {
      queryInput.FilterExpression = '(ownerId = :ownerId) OR attribute_not_exists(ownerId)';
      queryInput.ExpressionAttributeValues[':ownerId'] = ownerId;
    }

    const result = await this.client.send(new QueryCommand(queryInput));

    return (result.Items ?? []).map((item) => normalizeAnnotationRecord(item as AnnotationRecord));
  }

  // 新しいアノテーションを登録する
  async createAnnotation(
    docId: string,
    ownerId: string,
    authorId: string,
    payload: { start: number; end: number; tag: string; comment?: string; props?: Record<string, unknown> },
    textLength: number,
    existingAnnotations: AnnotationRecord[]
  ): Promise<AnnotationRecord> {
    // 歌詞長と重複を確認し、MVP では重なりを禁止
    this.validateRange(payload.start, payload.end, textLength);

    if (existingAnnotations.some((ann) => overlaps(payload.start, payload.end, ann.start, ann.end))) {
      throw new HttpError(400, 'Annotation overlaps');
    }

    const timestamp = now();
    const annotation: AnnotationRecord = {
      docId,
      annotationId: nanoid(),
      ownerId,
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

  // 既存アノテーションを編集する
  async updateAnnotation(
    docId: string,
    ownerId: string,
    annotationId: string,
    payload: { start: number; end: number; tag: string; comment?: string; props?: Record<string, unknown> },
    textLength: number,
    existingAnnotations: AnnotationRecord[]
  ): Promise<AnnotationRecord> {
    // 更新時も範囲チェックと重複チェックを再実施
    this.validateRange(payload.start, payload.end, textLength);

    if (
      existingAnnotations.some(
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
            'SET #start = :start, #end = :end, tag = :tag, comment = :comment, props = :props, updatedAt = :updatedAt, version = version + :inc, ownerId = if_not_exists(ownerId, :ownerId)',
          ConditionExpression: 'attribute_exists(annotationId) AND (ownerId = :ownerId OR attribute_not_exists(ownerId))',
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
            ':ownerId': ownerId,
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
      throw new NotFoundError('Annotation not found');
    }

    return normalizeAnnotationRecord(result.Attributes as AnnotationRecord);
  }

  async deleteAnnotation(docId: string, ownerId: string, annotationId: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({
        TableName: this.config.annotationsTable,
        Key: { docId, annotationId },
        ConditionExpression: 'ownerId = :ownerId',
        ExpressionAttributeValues: {
          ':ownerId': ownerId
        }
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
      if (statusCode === 404) {
        throw new NotFoundError(message);
      }
      throw new HttpError(statusCode, message);
    }
    throw error;
  }
}
