// LyricsRepository を遅延生成しシングルトンで提供するサービス層。
import { getDocumentClient } from '../utils/dynamo';
import { getTableConfig } from '../config/env';
import { LyricsRepository } from '../repositories/LyricsRepository';

let repository: LyricsRepository | null = null;

export const getLyricsRepository = () => {
  if (!repository) {
    // テーブル設定と DocumentClient を組み合わせて初期化
    repository = new LyricsRepository(getDocumentClient(), getTableConfig());
  }
  return repository;
};
