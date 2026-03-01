// UsersRepository を遅延生成し、シングルトンとして提供する。
import { getDocumentClient } from '../utils/dynamo';
import { getTableConfig } from '../config/env';
import { UsersRepository } from '../repositories/UsersRepository';

let repository: UsersRepository | null = null;

export const getUsersRepository = () => {
  if (!repository) {
    repository = new UsersRepository(getDocumentClient(), getTableConfig());
  }
  return repository;
};
