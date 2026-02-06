// 公開閲覧用の GET エンドポイントを提供するハンドラ。
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getLyricsRepository } from '../services/lyricsService';
import { handleError, HttpError, jsonResponse } from '../utils/http';
import { listPublicLyricsQuerySchema } from '../schemas/lyrics';

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

export const listPublicLyricsHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const rawQuery = {
      title: event.queryStringParameters?.title?.trim() || undefined,
      artist: event.queryStringParameters?.artist?.trim() || undefined,
      author: event.queryStringParameters?.author?.trim() || undefined
    };
    const query = listPublicLyricsQuerySchema.parse(rawQuery);
    const items = await repository.listPublicLyrics({
      title: query.title?.length ? query.title : undefined,
      artist: query.artist?.length ? query.artist : undefined,
      author: query.author?.length ? query.author : undefined
    });
    return jsonResponse(200, items);
  } catch (error) {
    return handleError(error);
  }
};
