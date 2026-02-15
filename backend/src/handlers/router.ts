// このファイルは API Gateway のルートキーに応じて個別ハンドラへディスパッチするエントリーポイント。
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import {
  createAnnotationHandler,
  createLyricHandler,
  deleteAnnotationHandler,
  deleteLyricHandler,
  getLyricHandler,
  getVersionHandler,
  listLyricsHandler,
  listVersionsHandler,
  shareLyricHandler,
  updateAnnotationHandler,
  updateLyricHandler
} from './lyrics';
import { getPublicLyricHandler, listPublicLyricsHandler } from './public';
import { jsonResponse, getCorsHeaders } from '../utils/http';

type AsyncHandler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

const routeHandlers: Record<string, AsyncHandler> = {
  'POST /v1/lyrics': createLyricHandler,
  'GET /v1/lyrics': listLyricsHandler,
  'GET /v1/lyrics/{docId}': getLyricHandler,
  'PUT /v1/lyrics/{docId}': updateLyricHandler,
  'DELETE /v1/lyrics/{docId}': deleteLyricHandler,
  'POST /v1/lyrics/{docId}/share': shareLyricHandler,
  'POST /v1/lyrics/{docId}/annotations': createAnnotationHandler,
  'PUT /v1/lyrics/{docId}/annotations/{annotationId}': updateAnnotationHandler,
  'DELETE /v1/lyrics/{docId}/annotations/{annotationId}': deleteAnnotationHandler,
  'GET /v1/lyrics/{docId}/versions': listVersionsHandler,
  'GET /v1/lyrics/{docId}/versions/{version}': getVersionHandler,
  'GET /v1/public/lyrics': listPublicLyricsHandler,
  'GET /v1/public/lyrics/{docId}': getPublicLyricHandler
};

// レスポンスに CORS ヘッダーを追加するラッパー
const withCors = (
  response: APIGatewayProxyResultV2,
  requestOrigin?: string
): APIGatewayProxyResultV2 => {
  // APIGatewayProxyResultV2 は string の場合もあるため、オブジェクトかどうかをチェック
  if (typeof response === 'string') {
    return response;
  }
  const corsHeaders = getCorsHeaders(requestOrigin);
  return {
    ...response,
    headers: {
      ...corsHeaders,
      ...(response.headers ?? {})
    }
  };
};

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const routeKey = event.requestContext.routeKey;
  const requestOrigin = event.headers?.origin;
  const target = routeHandlers[routeKey];

  if (!target) {
    // 実装されていないルートの場合は 404 を返却
    return withCors(jsonResponse(404, { message: `Route ${routeKey} not implemented` }), requestOrigin);
  }

  const response = await target(event);
  return withCors(response, requestOrigin);
};
