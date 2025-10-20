import { getDocumentClient } from '../utils/dynamo';
import { getTableConfig } from '../config/env';
import { LyricsRepository } from '../repositories/LyricsRepository';

let repository: LyricsRepository | null = null;

export const getLyricsRepository = () => {
  if (!repository) {
    repository = new LyricsRepository(getDocumentClient(), getTableConfig());
  }
  return repository;
};
