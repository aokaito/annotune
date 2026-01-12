import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import type { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { LyricsRepository } from '../LyricsRepository';
import { HttpError } from '../../utils/http';
import { NotFoundError } from '../../utils/errors';

// DynamoDBDocumentClient全体をモック化
vi.mock('@aws-sdk/lib-dynamodb', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    DynamoDBDocumentClient: {
      from: () => ({
        send: vi.fn(),
      }),
    },
  };
});

const mockDocClient = DynamoDBDocumentClient.from({} as DynamoDBClient);
const sendMock = mockDocClient.send as vi.Mock;

describe('LyricsRepository', () => {
  let repository: LyricsRepository;

  beforeEach(() => {
    vi.resetAllMocks();
    repository = new LyricsRepository(mockDocClient, {
      lyricsTable: 'lyrics',
      annotationsTable: 'annotations',
      versionsTable: 'versions',
    });
  });

  describe('createLyric', () => {
    it('正常系: 歌詞を正常に作成できること', async () => {
      // GIVEN
      const ownerId = 'user-123';
      const payload = {
        title: 'Test Song',
        artist: 'Test Artist',
        text: 'Hello world',
        ownerName: 'Test User',
      };
      // storeVersionSnapshotも呼ばれるので、そのモックも設定
      sendMock.mockResolvedValueOnce({}); // for createLyric PutCommand
      sendMock.mockResolvedValueOnce({}); // for storeVersionSnapshot PutCommand

      // WHEN
      const result = await repository.createLyric(ownerId, payload);

      // THEN
      expect(result.ownerId).toBe(ownerId);
      expect(result.title).toBe(payload.title);
      expect(result.version).toBe(1);
      expect(sendMock).toHaveBeenCalledTimes(2);

      const createLyricCall = sendMock.mock.calls[0][0];
      expect(createLyricCall.constructor.name).toBe('PutCommand');
      expect(createLyricCall.input.TableName).toBe('lyrics');
      expect(createLyricCall.input.Item.docId).toBeDefined();

      const storeVersionCall = sendMock.mock.calls[1][0];
      expect(storeVersionCall.constructor.name).toBe('PutCommand');
      expect(storeVersionCall.input.TableName).toBe('versions');
      expect(storeVersionCall.input.Item.version).toBe(1);
    });

    it('異常系: 同じdocIdが既に存在する場合、HttpError(409)をスローすること', async () => {
      // GIVEN
      const ownerId = 'user-123';
      const payload = { title: 'Test', artist: 'Test', text: 'Test' };
      const exception = new ConditionalCheckFailedException({
        message: 'Conditional check failed',
        $metadata: {},
      });
      sendMock.mockRejectedValueOnce(exception);

      // WHEN / THEN
      await expect(repository.createLyric(ownerId, payload)).rejects.toThrow(
        new HttpError(409, 'Document already exists')
      );
    });
  });

  describe('getLyric', () => {
    it('正常系: 歌詞とアノテーションを正常に取得できること', async () => {
      // GIVEN
      const docId = 'doc-123';
      const ownerId = 'user-123';
      const lyricItem = {
        docId,
        ownerId,
        title: 'Test Song',
        text: 'line1',
        version: 1,
      };
      // getLyricのGetCommand
      sendMock.mockResolvedValueOnce({ Item: lyricItem });
      // loadAnnotationsのQueryCommand
      sendMock.mockResolvedValueOnce({ Items: [] });

      // WHEN
      const result = await repository.getLyric(docId, ownerId);

      // THEN
      expect(result.docId).toBe(docId);
      expect(result.annotations).toEqual([]);
      expect(sendMock).toHaveBeenCalledTimes(2);

      const getLyricCall = sendMock.mock.calls[0][0];
      expect(getLyricCall.constructor.name).toBe('GetCommand');
      expect(getLyricCall.input.Key.docId).toBe(docId);
    });

    it('異常系: 歌詞が見つからない場合、NotFoundErrorをスローすること', async () => {
      // GIVEN
      const docId = 'doc-not-exist';
      sendMock.mockResolvedValueOnce({ Item: undefined });

      // WHEN / THEN
      await expect(repository.getLyric(docId)).rejects.toThrow(
        new NotFoundError('Document not found')
      );
    });

    it('異常系: 所有者が異なる場合、HttpError(403)をスローすること', async () => {
      // GIVEN
      const docId = 'doc-123';
      const lyricItem = { docId, ownerId: 'another-user' };
      sendMock.mockResolvedValueOnce({ Item: lyricItem });

      // WHEN / THEN
      await expect(repository.getLyric(docId, 'current-user')).rejects.toThrow(
        new HttpError(403, 'Forbidden')
      );
    });
  });
});
