// 公開閲覧用の GET エンドポイントを提供するハンドラ。
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getLyricsRepository } from '../services/lyricsService';
import { handleError, HttpError, jsonResponse } from '../utils/http';

const repository = getLyricsRepository();

export const getPublicLyricHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const { docId } = event.pathParameters ?? {};
    if (!docId) {
      throw new HttpError(400, 'Missing docId');
    }
    // 公開設定を確認しつつドキュメントを取得
    const lyric = await repository.getLyricForPublic(docId);
    return jsonResponse(200, lyric);
  } catch (error) {
    return handleError(error);
  }
};
