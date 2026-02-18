// 歌詞・アノテーション関連の Lambda ハンドラ群。
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
    // リクエストボディの JSON 解析に失敗した場合は 400 を返す
    throw new HttpError(400, 'Invalid JSON payload');
  }
};

export const createLyricHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    // 認証トークンからユーザー情報を取得
    const user = getAuthenticatedUser(event);
    // 入力値を zod で検証
    const payload = createLyricSchema.parse(parseBody(event));
    const ownerName = payload.ownerName?.trim() || user.displayName;
    const lyric = await repository.createLyric(user.userId, {
      title: payload.title,
      artist: payload.artist,
      text: payload.text,
      ownerName
    });
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
      // 今回の MVP では mine=true のみサポート
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
    // 所有者チェック込みでドキュメントを取得
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

    // バージョン番号を指定して楽観ロック更新
    const updated = await repository.updateLyric(docId, user.userId, {
      title: body.title,
      artist: body.artist,
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
    // 所有者チェック済みで削除
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
    // 公開可否を反転し、公開する場合はownerNameを更新
    // リクエストに含まれるownerNameを優先、なければCognitoのdisplayNameを使用
    const ownerName = payload.isPublicView
      ? (payload.ownerName?.trim() || user.displayName)
      : undefined;
    const lyric = await repository.shareLyric(docId, user.userId, payload.isPublicView, ownerName);
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
    // 作成者は本人のみ（MVP 要件）
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
    // 所有者確認の上で履歴一覧を返す
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
    // 指定バージョンのスナップショットを取得
    const snapshot = await repository.getVersion(docId, Number(version), user.userId);
    return jsonResponse(200, snapshot);
  } catch (error) {
    return handleError(error);
  }
};
