// ユーザープロフィール関連の Lambda ハンドラ。
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAuthenticatedUser } from '../utils/auth';
import { getLyricsRepository } from '../services/lyricsService';
import { handleError, HttpError, jsonResponse } from '../utils/http';
import { updateProfileSchema } from '../schemas/user';

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

// プロフィール（displayName）更新ハンドラー
// 認証ユーザーの全歌詞の ownerName を一括更新する
export const updateProfileHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthenticatedUser(event);
    const payload = updateProfileSchema.parse(parseBody(event));
    const newDisplayName = payload.displayName.trim();

    if (!newDisplayName) {
      throw new HttpError(400, 'アカウント名は空にできません');
    }

    const updatedCount = await repository.updateOwnerNameForUser(user.userId, newDisplayName);

    return jsonResponse(200, {
      message: `${updatedCount}件の歌詞の作成者名を更新しました`,
      updatedCount,
      displayName: newDisplayName
    });
  } catch (error) {
    return handleError(error);
  }
};
