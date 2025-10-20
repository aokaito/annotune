export interface TableConfig {
  lyricsTable: string;
  annotationsTable: string;
  versionsTable: string;
  lyricsOwnerIndex?: string;
}

export const getTableConfig = (): TableConfig => {
  const lyricsTable = process.env.LYRICS_TABLE_NAME;
  const annotationsTable = process.env.ANNOTATIONS_TABLE_NAME;
  const versionsTable = process.env.VERSIONS_TABLE_NAME;
  const lyricsOwnerIndex = process.env.LYRICS_OWNER_INDEX_NAME;

  if (!lyricsTable || !annotationsTable || !versionsTable) {
    throw new Error('Missing DynamoDB table environment variables');
  }

  return { lyricsTable, annotationsTable, versionsTable, lyricsOwnerIndex };
};

export const getRegion = () => process.env.AWS_REGION ?? 'ap-northeast-1';
