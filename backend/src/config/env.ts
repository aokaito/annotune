// この設定では DynamoDB テーブルとインデックスの環境変数をまとめて扱う。
export interface TableConfig {
  lyricsTable: string;
  annotationsTable: string;
  versionsTable: string;
  lyricsOwnerIndex?: string;
  lyricsPublicStatusIndex?: string;
}

export const getTableConfig = (): TableConfig => {
  // ランタイム環境の変数からテーブル名を読み取る
  const lyricsTable = process.env.LYRICS_TABLE_NAME;
  const annotationsTable = process.env.ANNOTATIONS_TABLE_NAME;
  const versionsTable = process.env.VERSIONS_TABLE_NAME;
  const lyricsOwnerIndex = process.env.LYRICS_OWNER_INDEX_NAME;
  const lyricsPublicStatusIndex = process.env.LYRICS_PUBLIC_STATUS_INDEX_NAME;

  if (!lyricsTable || !annotationsTable || !versionsTable) {
    throw new Error('Missing DynamoDB table environment variables');
  }

  return { lyricsTable, annotationsTable, versionsTable, lyricsOwnerIndex, lyricsPublicStatusIndex };
};

// 利用する AWS リージョンを取得（設定が無ければ東京リージョン）
export const getRegion = () => process.env.AWS_REGION ?? 'ap-northeast-1';
