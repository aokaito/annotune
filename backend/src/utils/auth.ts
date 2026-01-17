// このユーティリティは API Gateway の JWT クレームからユーザー情報を取り出す。
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { HttpError } from './http';
import type { AnnotuneUser } from '../types';

export const getAuthenticatedUser = (event: APIGatewayProxyEventV2): AnnotuneUser => {
  const claims = event.requestContext.authorizer?.jwt?.claims as
    | {
        sub?: string;
        name?: string;
        email?: string;
        preferred_username?: string;
        username?: string;
        'cognito:username'?: string;
      }
    | undefined;

  if (!claims?.sub) {
    // サブジェクトが無い場合は未認証扱い
    throw new HttpError(401, 'Unauthorized');
  }

  return {
    userId: claims.sub,
    displayName:
      claims.name ??
      claims.preferred_username ??
      claims.email ??
      claims.username ??
      claims['cognito:username'] ??
      claims.sub
  };
};
