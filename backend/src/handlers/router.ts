import type { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from 'aws-lambda';
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
import { getPublicLyricHandler } from './public';
import { jsonResponse } from '../utils/http';

const routeHandlers: Record<string, APIGatewayProxyHandlerV2> = {
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
  'GET /v1/public/lyrics/{docId}': getPublicLyricHandler
};

export const handler: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  const routeKey = event.requestContext.routeKey;
  const target = routeHandlers[routeKey];

  if (!target) {
    return jsonResponse(404, { message: `Route ${routeKey} not implemented` });
  }

  return target(event);
};
