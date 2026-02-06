import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { NotFoundError } from '../utils/errors';
import { HttpError } from '../utils/http';
import type { DocVersionRecord } from '../types';
import type { TableConfig } from '../config/env';

const normalizeVersionRecord = (record: Partial<DocVersionRecord>): DocVersionRecord => ({
  ...(record as DocVersionRecord),
  artist: record.artist ?? '',
  ownerId: record.ownerId ?? ''
});

export class VersionsRepository {
  constructor(private readonly client: DynamoDBDocumentClient, private readonly config: TableConfig) {}

  // バージョン履歴を取得（新しい順）
  async listVersions(docId: string, ownerId: string): Promise<DocVersionRecord[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.config.versionsTable,
        KeyConditionExpression: 'docId = :docId',
        ExpressionAttributeValues: {
          ':docId': docId,
          ':ownerId': ownerId
        },
        FilterExpression: '(ownerId = :ownerId) OR attribute_not_exists(ownerId)',
        ScanIndexForward: false // 降順（新しい順）で取得
      })
    );

    return (result.Items ?? []).map((item) => normalizeVersionRecord(item as DocVersionRecord));
  }

  // 指定バージョンのスナップショットを取得する
  async getVersion(docId: string, version: number, ownerId: string): Promise<DocVersionRecord> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.config.versionsTable,
        Key: { docId, version }
      })
    );

    if (!result.Item) {
      throw new NotFoundError('Version not found');
    }

    const record = result.Item as DocVersionRecord;
    if (record.ownerId && record.ownerId !== ownerId) {
      throw new HttpError(403, 'Forbidden');
    }

    return normalizeVersionRecord(record);
  }

  // バージョンスナップショットを保存
  async storeVersionSnapshot(snapshot: DocVersionRecord): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.config.versionsTable,
        Item: snapshot
      })
    );
  }
}
