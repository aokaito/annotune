// SitemapGenerator Lambda: 公開歌詞の一覧を DynamoDB から取得し、
// sitemap.xml を生成して S3 に保存、CloudFront キャッシュを無効化する。
// EventBridge スケジュール（1時間ごと）および shareLyric API から非同期呼び出しされる。
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';

const SITE_DOMAIN = 'https://www.annotune.net';

const TABLE_NAME = process.env.LYRICS_TABLE_NAME ?? '';
const PUBLIC_STATUS_INDEX = process.env.LYRICS_PUBLIC_STATUS_INDEX_NAME ?? '';
const BUCKET_NAME = process.env.FRONTEND_BUCKET_NAME ?? '';
const DISTRIBUTION_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID ?? '';

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION ?? 'ap-northeast-1' });
const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'ap-northeast-1' });
// CloudFront API は us-east-1 固定
const cf = new CloudFrontClient({ region: 'us-east-1' });

interface PublicDoc {
  docId: string;
  updatedAt: string;
}

async function fetchAllPublicDocs(): Promise<PublicDoc[]> {
  const docs: PublicDoc[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const result = await dynamo.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: PUBLIC_STATUS_INDEX,
        KeyConditionExpression: 'publicStatus = :status',
        ExpressionAttributeValues: { ':status': { S: 'public' } },
        // docId と updatedAt のみ取得（転送量を最小化）
        ProjectionExpression: 'docId, updatedAt',
        ExclusiveStartKey: lastKey as Record<string, import('@aws-sdk/client-dynamodb').AttributeValue> | undefined,
      })
    );

    for (const item of result.Items ?? []) {
      const docId = item.docId?.S;
      const updatedAt = item.updatedAt?.S ?? new Date().toISOString();
      if (docId) {
        docs.push({ docId, updatedAt });
      }
    }

    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  return docs;
}

function buildSitemapXml(docs: PublicDoc[]): string {
  const urlEntries = docs
    .map((doc) => {
      const lastmod = doc.updatedAt.split('T')[0]; // YYYY-MM-DD
      return [
        '  <url>',
        `    <loc>${SITE_DOMAIN}/public/lyrics/${doc.docId}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        '    <changefreq>weekly</changefreq>',
        '    <priority>0.8</priority>',
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <url>',
    `    <loc>${SITE_DOMAIN}/</loc>`,
    '    <changefreq>weekly</changefreq>',
    '    <priority>1.0</priority>',
    '  </url>',
    urlEntries,
    '</urlset>',
  ].join('\n');
}

export const handler = async (): Promise<void> => {
  console.log(JSON.stringify({ message: 'SitemapGenerator started' }));

  // 1. 全公開歌詞を取得（ページネーション対応）
  const docs = await fetchAllPublicDocs();
  console.log(JSON.stringify({ message: 'Fetched public docs', count: docs.length }));

  // 2. sitemap.xml を生成
  const xml = buildSitemapXml(docs);

  // 3. S3 に書き込み
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: 'sitemap.xml',
      Body: xml,
      ContentType: 'application/xml; charset=utf-8',
      // Google が 1 時間以内に最新版を取得できるよう短い TTL を指定
      CacheControl: 'public, max-age=3600',
    })
  );
  console.log(JSON.stringify({ message: 'sitemap.xml written to S3' }));

  // 4. CloudFront キャッシュを無効化して即時反映
  await cf.send(
    new CreateInvalidationCommand({
      DistributionId: DISTRIBUTION_ID,
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: { Quantity: 1, Items: ['/sitemap.xml'] },
      },
    })
  );
  console.log(JSON.stringify({ message: 'CloudFront invalidation created for /sitemap.xml' }));
};
