// このユーティリティは API Gateway の JWT クレームからユーザー情報を取り出す。
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { HttpError } from './http';
import type { AnnotuneUser } from '../types';

// APIGatewayProxyEventV2 は authorizer プロパティを持たないが、
// JWT Authorizer 使用時にはランタイムで JWT クレームが含まれる
interface JWTClaims {
  sub?: string;
  name?: string;
  email?: string;
  preferred_username?: string;
  username?: string;
  'cognito:username'?: string;
}

interface JWTAuthorizerContext {
  jwt?: {
    claims?: JWTClaims;
  };
}

export const getAuthenticatedUser = (event: APIGatewayProxyEventV2): AnnotuneUser => {
  const authorizer = (event.requestContext as { authorizer?: JWTAuthorizerContext }).authorizer;
  const claims = authorizer?.jwt?.claims;

  if (!claims?.sub) {
    // サブジェクトが無い場合は未認証扱い
    throw new HttpError(401, 'Unauthorized');
  }

  return {
    userId: claims.sub,
    displayName:
      claims.name ??
      claims.preferred_username ??
      claims['cognito:username'] ??
      claims.username ??
      claims.email
  };
};
