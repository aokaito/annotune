// API Gateway で使うレスポンス整形とエラーハンドリングを提供。
import type { APIGatewayProxyResultV2 } from 'aws-lambda';

export const jsonResponse = (statusCode: number, body: unknown): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN ?? '*',
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
  console.error('Unexpected error', error);
  return jsonResponse(500, { message: 'Internal Server Error' });
};
