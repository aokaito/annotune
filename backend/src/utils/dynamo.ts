// このユーティリティは DynamoDB DocumentClient をシングルトンで生成する。
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { getRegion } from '../config/env';

let cachedClient: DynamoDBDocumentClient | null = null;

export const getDocumentClient = (): DynamoDBDocumentClient => {
  // 1 度生成した DocumentClient を再利用して接続数を抑える
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
