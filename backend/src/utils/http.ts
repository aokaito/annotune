import type { APIGatewayProxyResultV2 } from 'aws-lambda';
import { ZodError } from 'zod';
import { logger } from './logger';
import { NotFoundError } from './errors';

export const jsonResponse = (statusCode: number, body: unknown): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN ?? '*', // クロスオリジン制御のための設定。必要に応じてフロントのドメインに限定する
    'Access-Control-Allow-Credentials': 'true'
  },
  body: JSON.stringify(body)
});

export class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export const handleError = (error: unknown): APIGatewayProxyResultV2 => {
  if (error instanceof HttpError) {
    // 事前に想定したエラーはそのままクライアントへ返す
    return jsonResponse(error.statusCode, { message: error.message });
  }
  if (error instanceof ZodError) {
    // Zod のバリデーションエラー
    return jsonResponse(400, {
      code: 'VALIDATION_ERROR',
      message: 'リクエスト内容が不正です',
      issues: error.errors
    });
  }
  if (error instanceof NotFoundError) {
    // リソースが見つからなかった場合
    return jsonResponse(404, { code: 'NOT_FOUND', message: error.message });
  }

  logger.error({ err: error }, 'Unexpected error');
  return jsonResponse(500, { message: 'Internal Server Error' });
};
