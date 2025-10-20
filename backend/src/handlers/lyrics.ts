import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAuthenticatedUser } from '../utils/auth';
import { getLyricsRepository } from '../services/lyricsService';
import { handleError, HttpError, jsonResponse } from '../utils/http';
import {
  annotationSchema,
  createLyricSchema,
  shareSchema,
  updateLyricSchema
} from '../schemas/lyrics';

const repository = getLyricsRepository();

const parseBody = <T>(event: APIGatewayProxyEventV2): T => {
  if (!event.body) {
    throw new HttpError(400, 'Missing body');
  }
  try {
    return JSON.parse(event.body) as T;
  } catch (error) {
    throw new HttpError(400, 'Invalid JSON payload');
  }
};

export const createLyricHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthenticatedUser(event);
    const payload = createLyricSchema.parse(parseBody(event));
    const lyric = await repository.createLyric(user.userId, payload);
    return jsonResponse(201, lyric);
  } catch (error) {
    return handleError(error);
  }
};

export const listLyricsHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthenticatedUser(event);
    const mine = event.queryStringParameters?.mine === 'true';
    if (!mine) {
      return jsonResponse(400, { message: 'Only mine=true endpoint is supported in MVP' });
    }
    const items = await repository.listLyrics(user.userId);
    return jsonResponse(200, items);
  } catch (error) {
    return handleError(error);
  }
};

export const getLyricHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthenticatedUser(event);
    const { docId } = event.pathParameters ?? {};
    if (!docId) {
      throw new HttpError(400, 'Missing docId');
    }
    const lyric = await repository.getLyric(docId, user.userId);
    return jsonResponse(200, lyric);
  } catch (error) {
    return handleError(error);
  }
};

export const updateLyricHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthenticatedUser(event);
    const { docId } = event.pathParameters ?? {};
    if (!docId) {
      throw new HttpError(400, 'Missing docId');
    }

    const headerVersion = event.headers?.['x-doc-version'] ?? event.headers?.['X-Doc-Version'];
    const body = updateLyricSchema.parse(parseBody(event));
    const version = headerVersion ? Number(headerVersion) : body.version;
    if (!Number.isFinite(version)) {
      throw new HttpError(400, 'Missing version header or body value');
    }

    const updated = await repository.updateLyric(docId, user.userId, {
      title: body.title,
      text: body.text,
      version
    });

    return jsonResponse(200, updated);
  } catch (error) {
    return handleError(error);
  }
};

export const deleteLyricHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthenticatedUser(event);
    const { docId } = event.pathParameters ?? {};
    if (!docId) {
      throw new HttpError(400, 'Missing docId');
    }
    await repository.deleteLyric(docId, user.userId);
    return jsonResponse(204, {});
  } catch (error) {
    return handleError(error);
  }
};

export const shareLyricHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthenticatedUser(event);
    const { docId } = event.pathParameters ?? {};
    if (!docId) {
      throw new HttpError(400, 'Missing docId');
    }
    const payload = shareSchema.parse(parseBody(event));
    const lyric = await repository.shareLyric(docId, user.userId, payload.isPublicView);
    return jsonResponse(200, lyric);
  } catch (error) {
    return handleError(error);
  }
};

export const createAnnotationHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthenticatedUser(event);
    const { docId } = event.pathParameters ?? {};
    if (!docId) {
      throw new HttpError(400, 'Missing docId');
    }
    const payload = annotationSchema.parse(parseBody(event));
    const annotation = await repository.createAnnotation(docId, user.userId, user.userId, payload);
    return jsonResponse(201, annotation);
  } catch (error) {
    return handleError(error);
  }
};

export const updateAnnotationHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthenticatedUser(event);
    const { docId, annotationId } = event.pathParameters ?? {};
    if (!docId || !annotationId) {
      throw new HttpError(400, 'Missing path parameters');
    }
    const payload = annotationSchema.parse(parseBody(event));
    const annotation = await repository.updateAnnotation(docId, user.userId, annotationId, payload);
    return jsonResponse(200, annotation);
  } catch (error) {
    return handleError(error);
  }
};

export const deleteAnnotationHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthenticatedUser(event);
    const { docId, annotationId } = event.pathParameters ?? {};
    if (!docId || !annotationId) {
      throw new HttpError(400, 'Missing path parameters');
    }
    await repository.deleteAnnotation(docId, user.userId, annotationId);
    return jsonResponse(204, {});
  } catch (error) {
    return handleError(error);
  }
};

export const listVersionsHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthenticatedUser(event);
    const { docId } = event.pathParameters ?? {};
    if (!docId) {
      throw new HttpError(400, 'Missing docId');
    }
    const items = await repository.listVersions(docId, user.userId);
    return jsonResponse(200, items);
  } catch (error) {
    return handleError(error);
  }
};

export const getVersionHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthenticatedUser(event);
    const { docId, version } = event.pathParameters ?? {};
    if (!docId || !version) {
      throw new HttpError(400, 'Missing path parameters');
    }
    const snapshot = await repository.getVersion(docId, Number(version), user.userId);
    return jsonResponse(200, snapshot);
  } catch (error) {
    return handleError(error);
  }
};
