// Lambda@Edge: SNSクローラー向けOGP動的生成
// NOTE: Lambda@Edgeでは環境変数が使えないため、テーブル名・リージョンをハードコード
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import type { CloudFrontRequestEvent, CloudFrontRequestResult, CloudFrontRequest } from 'aws-lambda';

const TABLE_NAME = 'AnnotuneLyrics';
const DYNAMODB_REGION = 'ap-northeast-1';
const SITE_DOMAIN = 'www.annotune.net';

// SNSクローラーのUser-Agentパターン
const SNS_CRAWLER_PATTERN = /Twitterbot|facebookexternalhit|LinkedInBot|Slackbot|Discordbot|Line|Googlebot/i;

// 公開歌詞URLパターン: /public/lyrics/{docId}
const PUBLIC_LYRICS_PATTERN = /^\/public\/lyrics\/([a-zA-Z0-9_-]+)$/;

// DynamoDBクライアント（Lambda@Edgeはus-east-1で実行されるが、DBはap-northeast-1）
const dynamodb = new DynamoDBClient({ region: DYNAMODB_REGION });

export const handler = async (event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> => {
  const request = event.Records[0].cf.request;
  const userAgent = request.headers['user-agent']?.[0]?.value || '';
  const uri = request.uri;

  // クローラー以外は通常のS3オリジンへ
  if (!SNS_CRAWLER_PATTERN.test(userAgent)) {
    return request;
  }

  // URLパターンマッチ
  const match = uri.match(PUBLIC_LYRICS_PATTERN);
  if (!match) {
    return request;
  }

  const docId = match[1];

  try {
    const result = await dynamodb.send(new GetItemCommand({
      TableName: TABLE_NAME,
      Key: { docId: { S: docId } },
      ProjectionExpression: 'title, artist, isPublicView, ownerName'
    }));

    const item = result.Item;

    // 存在しない or 非公開の場合はフォールバックOGP
    if (!item || item.isPublicView?.BOOL !== true) {
      return generateOgpResponse(docId, 'Annotune', '', '');
    }

    const title = item.title?.S || '無題';
    const artist = item.artist?.S || '';
    const ownerName = item.ownerName?.S || '';

    return generateOgpResponse(docId, title, artist, ownerName);
  } catch (error) {
    console.error('DynamoDB access error:', JSON.stringify({ docId, error: String(error) }));
    // エラー時もフォールバックOGPを返す
    return generateOgpResponse(docId, 'Annotune', '', '');
  }
};

function generateOgpResponse(
  docId: string,
  title: string,
  artist: string,
  ownerName: string
): CloudFrontRequestResult {
  const isFound = title !== 'Annotune';

  const ogTitle = isFound
    ? `${title}${artist ? ` - ${artist}` : ''} の練習ノート`
    : 'Annotune - 歌唱テクニック練習ノート';

  const ogDescription = isFound
    ? `${ownerName ? `${ownerName}さんの` : ''}ビブラート・しゃくりなどの歌唱テクニック注釈付きノート`
    : '歌唱テクニックを可視化して練習をサポート';

  const canonicalUrl = `https://${SITE_DOMAIN}/public/lyrics/${docId}`;
  const ogImageUrl = `https://${SITE_DOMAIN}/og-image.png`;

  const html = `<!DOCTYPE html>
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

  return {
    status: '200',
    statusDescription: 'OK',
    headers: {
      'content-type': [{ key: 'Content-Type', value: 'text/html; charset=utf-8' }],
      'cache-control': [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }]
    },
    body: html
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
