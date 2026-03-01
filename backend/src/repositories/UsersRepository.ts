// ユーザープロフィールの永続化を担当するリポジトリ。
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import type { UserProfile } from '../types';
import type { TableConfig } from '../config/env';

const now = () => new Date().toISOString();

export class UsersRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: TableConfig
  ) {}

  async getUser(userId: string): Promise<UserProfile | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.config.usersTable,
        Key: { userId }
      })
    );
    return (result.Item as UserProfile) ?? null;
  }

  async createUser(profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    const timestamp = now();
    const item: UserProfile = {
      ...profile,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await this.client.send(
      new PutCommand({
        TableName: this.config.usersTable,
        Item: item,
        ConditionExpression: 'attribute_not_exists(userId)'
      })
    );

    return item;
  }

  async updateDisplayName(userId: string, displayName: string): Promise<UserProfile> {
    const timestamp = now();

    const result = await this.client.send(
      new UpdateCommand({
        TableName: this.config.usersTable,
        Key: { userId },
        UpdateExpression: 'SET displayName = :displayName, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':displayName': displayName,
          ':updatedAt': timestamp
        },
        ReturnValues: 'ALL_NEW'
      })
    );

    return result.Attributes as UserProfile;
  }

  async getOrCreateUser(userId: string, defaultDisplayName: string): Promise<UserProfile> {
    const existing = await this.getUser(userId);
    if (existing) {
      return existing;
    }

    try {
      return await this.createUser({ userId, displayName: defaultDisplayName });
    } catch (error) {
      // 競合（別リクエストで作成済み）の場合は再取得
      if ((error as { name?: string }).name === 'ConditionalCheckFailedException') {
        const user = await this.getUser(userId);
        if (user) return user;
      }
      throw error;
    }
  }

  async batchGetUsers(userIds: string[]): Promise<Map<string, UserProfile>> {
    const result = new Map<string, UserProfile>();

    if (userIds.length === 0) {
      return result;
    }

    // 重複を除去
    const uniqueIds = [...new Set(userIds)];

    // DynamoDB BatchGetItemの制約: 最大100件
    const BATCH_SIZE = 100;
    for (let i = 0; i < uniqueIds.length; i += BATCH_SIZE) {
      const batch = uniqueIds.slice(i, i + BATCH_SIZE);

      const response = await this.client.send(
        new BatchGetCommand({
          RequestItems: {
            [this.config.usersTable]: {
              Keys: batch.map((userId) => ({ userId }))
            }
          }
        })
      );

      const items = response.Responses?.[this.config.usersTable] ?? [];
      for (const item of items) {
        const profile = item as UserProfile;
        result.set(profile.userId, profile);
      }
    }

    return result;
  }
}
