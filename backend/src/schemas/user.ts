// プロフィール更新用の zod スキーマを定義する。
import { z } from 'zod';

// プロフィール更新時の入力要件
export const updateProfileSchema = z.object({
  displayName: z.string().min(1, 'アカウント名は必須です').max(50, 'アカウント名は50文字以内で入力してください')
});
