// 公開閲覧用の GET エンドポイントを提供するハンドラ。
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getLyricsRepository } from '../services/lyricsService';
import { handleError, HttpError, jsonResponse } from '../utils/http';
import { listPublicLyricsQuerySchema } from '../schemas/lyrics';

const repository = getLyricsRepository();

// SNSクローラーのUser-Agentパターン
const SNS_CRAWLER_PATTERN = /Twitterbot|facebookexternalhit|LinkedInBot|Slackbot|Discordbot|Line|Googlebot/i;

// OGP HTML生成用のユーティリティ
const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const generateOgpHtml = (
  docId: string,
  title: string,
  artist: string,
  ownerName: string,
  found: boolean
): string => {
  const siteDomain = 'www.annotune.net';
  const ogTitle = found
    ? `${title}${artist ? ` - ${artist}` : ''} の練習ノート`
    : 'Annotune - 歌唱テクニック練習ノート';
  const ogDescription = found
    ? `${ownerName ? `${ownerName}さんの` : ''}ビブラート・しゃくりなどの歌唱テクニック注釈付きノート`
    : '歌唱テクニックを可視化して練習をサポート';
  const canonicalUrl = `https://${siteDomain}/public/lyrics/${docId}`;
  const ogImageUrl = `https://${siteDomain}/og-image.png`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(ogTitle)}</title>
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Annotune" />
  <meta property="og:title" content="${escapeHtml(ogTitle)}" />
  <meta property="og:description" content="${escapeHtml(ogDescription)}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:locale" content="ja_JP" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}" />
  <meta name="twitter:image" content="${ogImageUrl}" />
  <link rel="canonical" href="${canonicalUrl}" />
</head>
<body>
  <h1>${escapeHtml(ogTitle)}</h1>
  <p>${escapeHtml(ogDescription)}</p>
  <p><a href="${canonicalUrl}">Annotuneで見る</a></p>
</body>
</html>`;
};

export const getPublicLyricHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    const { docId } = event.pathParameters ?? {};
    if (!docId) {
      throw new HttpError(400, 'Missing docId');
    }

    // User-AgentがSNSクローラーの場合はOGP HTMLを返す
    const userAgent = event.headers['user-agent'] || '';
    if (SNS_CRAWLER_PATTERN.test(userAgent)) {
      try {
        const lyric = await repository.getLyricForPublic(docId);
        const html = generateOgpHtml(
          docId,
          lyric.title,
          lyric.artist || '',
          lyric.ownerName || '',
          true
        );
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=3600'
          },
          body: html
        };
      } catch {
        // 歌詞が見つからない or 非公開の場合はフォールバックOGP
        const html = generateOgpHtml(docId, '', '', '', false);
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300'
          },
          body: html
        };
      }
    }

    // 通常のAPIリクエストはJSONを返す
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
