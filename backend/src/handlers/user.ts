// ユーザープロフィール関連の Lambda ハンドラ。
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getAuthenticatedUser } from '../utils/auth';
import { getLyricsRepository } from '../services/lyricsService';
import { getUsersRepository } from '../services/usersService';
import { handleError, HttpError, jsonResponse } from '../utils/http';
import { updateProfileSchema } from '../schemas/user';

const lyricsRepository = getLyricsRepository();
const usersRepository = getUsersRepository();

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
// UsersTable の displayName を更新する（Source of Truth）
// 歌詞の ownerName キャッシュ更新はベストエフォートで行う
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

    // 1. UsersTable の displayName を更新（Source of Truth）
    await usersRepository.getOrCreateUser(user.userId, newDisplayName);
    await usersRepository.updateDisplayName(user.userId, newDisplayName);

    // 2. 歌詞の ownerName キャッシュを一括更新（ベストエフォート）
    let updatedCount = 0;
    try {
      updatedCount = await lyricsRepository.updateOwnerNameForUser(user.userId, newDisplayName);
    } catch (cacheError) {
      // キャッシュ更新に失敗してもUsersTableは更新済みなので続行
      console.warn('Failed to update lyrics ownerName cache:', cacheError);
    }

    return jsonResponse(200, {
      message: 'アカウント名を更新しました',
      updatedCount,
      displayName: newDisplayName
    });
  } catch (error) {
    return handleError(error);
  }
};
