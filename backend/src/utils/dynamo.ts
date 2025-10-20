// DynamoDB DocumentClient をシングルトン生成するユーティリティ。
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { getRegion } from '../config/env';

let cachedClient: DynamoDBDocumentClient | null = null;

export const getDocumentClient = (): DynamoDBDocumentClient => {
  if (!cachedClient) {
    // ベースクライアントを作り、DocumentClient に変換
    const base = new DynamoDBClient({ region: getRegion() });
    cachedClient = DynamoDBDocumentClient.from(base, {
      marshallOptions: {
        removeUndefinedValues: true
      }
    });
  }
  return cachedClient;
};
