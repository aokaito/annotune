import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

// Create hoisted mocks
const mockRepository = vi.hoisted(() => ({
  getLyricForPublic: vi.fn(),
  listPublicLyrics: vi.fn()
}));

// Mock dependencies
vi.mock('../../services/lyricsService', () => ({
  getLyricsRepository: () => mockRepository
}));

import { getPublicLyricHandler, listPublicLyricsHandler } from '../public';

const createMockEvent = (overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 => ({
  version: '2.0',
  routeKey: 'GET /v1/public/lyrics',
  rawPath: '/v1/public/lyrics',
  rawQueryString: '',
  headers: {},
  requestContext: {
    accountId: '123456789',
    apiId: 'api-id',
    domainName: 'test.execute-api.us-east-1.amazonaws.com',
    domainPrefix: 'test',
    http: {
      method: 'GET',
      path: '/v1/public/lyrics',
      protocol: 'HTTP/1.1',
      sourceIp: '127.0.0.1',
      userAgent: 'test'
    },
    requestId: 'req-id',
    routeKey: 'GET /v1/public/lyrics',
    stage: 'test',
    time: new Date().toISOString(),
    timeEpoch: Date.now()
  },
  isBase64Encoded: false,
  ...overrides
});

describe('getPublicLyricHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ALLOWED_ORIGIN = 'https://test.example.com';
  });

  it('should get a public lyric successfully', async () => {
    const mockLyric = {
      docId: 'doc-123',
      ownerId: 'user-123',
      ownerName: 'Test User',
      title: 'Test Song',
      artist: 'Test Artist',
      text: 'Test lyrics',
      version: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      isPublicView: true,
      annotations: []
    };
    mockRepository.getLyricForPublic.mockResolvedValue(mockLyric);

    const event = createMockEvent({
      pathParameters: { docId: 'doc-123' }
    });

    const result = await getPublicLyricHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toEqual(mockLyric);
  });

  it('should return 400 when docId is missing', async () => {
    const event = createMockEvent({
      pathParameters: {}
    });

    const result = await getPublicLyricHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body as string).message).toBe('Missing docId');
  });
});

describe('listPublicLyricsHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ALLOWED_ORIGIN = 'https://test.example.com';
  });

  it('should list public lyrics successfully', async () => {
    const mockLyrics = [
      { docId: 'doc-1', title: 'Song 1', artist: 'Artist 1' },
      { docId: 'doc-2', title: 'Song 2', artist: 'Artist 2' }
    ];
    mockRepository.listPublicLyrics.mockResolvedValue(mockLyrics);

    const event = createMockEvent();

    const result = await listPublicLyricsHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toEqual(mockLyrics);
    expect(mockRepository.listPublicLyrics).toHaveBeenCalledWith({
      title: undefined,
      artist: undefined,
      author: undefined
    });
  });

  it('should filter by title', async () => {
    const mockLyrics = [{ docId: 'doc-1', title: 'Test Song' }];
    mockRepository.listPublicLyrics.mockResolvedValue(mockLyrics);

    const event = createMockEvent({
      queryStringParameters: { title: 'Test' }
    });

    const result = await listPublicLyricsHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(200);
    expect(mockRepository.listPublicLyrics).toHaveBeenCalledWith({
      title: 'Test',
      artist: undefined,
      author: undefined
    });
  });

  it('should filter by artist', async () => {
    const mockLyrics = [{ docId: 'doc-1', artist: 'Test Artist' }];
    mockRepository.listPublicLyrics.mockResolvedValue(mockLyrics);

    const event = createMockEvent({
      queryStringParameters: { artist: 'Test Artist' }
    });

    const result = await listPublicLyricsHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(200);
    expect(mockRepository.listPublicLyrics).toHaveBeenCalledWith({
      title: undefined,
      artist: 'Test Artist',
      author: undefined
    });
  });

  it('should filter by author', async () => {
    const mockLyrics = [{ docId: 'doc-1', ownerName: 'Test Author' }];
    mockRepository.listPublicLyrics.mockResolvedValue(mockLyrics);

    const event = createMockEvent({
      queryStringParameters: { author: 'Test Author' }
    });

    const result = await listPublicLyricsHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(200);
    expect(mockRepository.listPublicLyrics).toHaveBeenCalledWith({
      title: undefined,
      artist: undefined,
      author: 'Test Author'
    });
  });

  it('should filter by multiple parameters', async () => {
    const mockLyrics = [{ docId: 'doc-1', title: 'Song', artist: 'Artist' }];
    mockRepository.listPublicLyrics.mockResolvedValue(mockLyrics);

    const event = createMockEvent({
      queryStringParameters: { title: 'Song', artist: 'Artist', author: 'Author' }
    });

    const result = await listPublicLyricsHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(200);
    expect(mockRepository.listPublicLyrics).toHaveBeenCalledWith({
      title: 'Song',
      artist: 'Artist',
      author: 'Author'
    });
  });

  it('should return 400 when title exceeds max length', async () => {
    const event = createMockEvent({
      queryStringParameters: { title: 'a'.repeat(201) }
    });

    const result = await listPublicLyricsHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body as string).code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when artist exceeds max length', async () => {
    const event = createMockEvent({
      queryStringParameters: { artist: 'a'.repeat(201) }
    });

    const result = await listPublicLyricsHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body as string).code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when author exceeds max length', async () => {
    const event = createMockEvent({
      queryStringParameters: { author: 'a'.repeat(101) }
    });

    const result = await listPublicLyricsHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body as string).code).toBe('VALIDATION_ERROR');
  });

  it('should trim whitespace from query parameters', async () => {
    mockRepository.listPublicLyrics.mockResolvedValue([]);

    const event = createMockEvent({
      queryStringParameters: { title: '  Test  ', artist: '  Artist  ' }
    });

    const result = await listPublicLyricsHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(200);
    expect(mockRepository.listPublicLyrics).toHaveBeenCalledWith({
      title: 'Test',
      artist: 'Artist',
      author: undefined
    });
  });

  it('should handle empty query parameters', async () => {
    mockRepository.listPublicLyrics.mockResolvedValue([]);

    const event = createMockEvent({
      queryStringParameters: { title: '', artist: '  ' }
    });

    const result = await listPublicLyricsHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(200);
    expect(mockRepository.listPublicLyrics).toHaveBeenCalledWith({
      title: undefined,
      artist: undefined,
      author: undefined
    });
  });
});
