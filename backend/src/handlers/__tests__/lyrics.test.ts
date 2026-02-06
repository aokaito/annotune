import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

// Create hoisted mocks
const mockRepository = vi.hoisted(() => ({
  createLyric: vi.fn(),
  getLyric: vi.fn(),
  listLyrics: vi.fn(),
  updateLyric: vi.fn(),
  deleteLyric: vi.fn(),
  shareLyric: vi.fn(),
  createAnnotation: vi.fn(),
  updateAnnotation: vi.fn(),
  deleteAnnotation: vi.fn()
}));

// Mock dependencies
vi.mock('../../services/lyricsService', () => ({
  getLyricsRepository: () => mockRepository
}));

vi.mock('../../utils/auth', () => ({
  getAuthenticatedUser: () => ({ userId: 'user-123', displayName: 'Test User' })
}));

import {
  createLyricHandler,
  getLyricHandler,
  listLyricsHandler,
  updateLyricHandler,
  deleteLyricHandler,
  shareLyricHandler,
  createAnnotationHandler,
  updateAnnotationHandler,
  deleteAnnotationHandler
} from '../lyrics';

const createMockEvent = (overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 => ({
  version: '2.0',
  routeKey: 'POST /v1/lyrics',
  rawPath: '/v1/lyrics',
  rawQueryString: '',
  headers: {},
  requestContext: {
    accountId: '123456789',
    apiId: 'api-id',
    domainName: 'test.execute-api.us-east-1.amazonaws.com',
    domainPrefix: 'test',
    http: {
      method: 'POST',
      path: '/v1/lyrics',
      protocol: 'HTTP/1.1',
      sourceIp: '127.0.0.1',
      userAgent: 'test'
    },
    requestId: 'req-id',
    routeKey: 'POST /v1/lyrics',
    stage: 'test',
    time: new Date().toISOString(),
    timeEpoch: Date.now()
  },
  isBase64Encoded: false,
  ...overrides
});

describe('createLyricHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set required environment variable
    process.env.ALLOWED_ORIGIN = 'https://test.example.com';
  });

  it('should create a lyric successfully', async () => {
    const mockLyric = {
      docId: 'doc-123',
      ownerId: 'user-123',
      title: 'Test Song',
      artist: 'Test Artist',
      text: 'Test lyrics',
      version: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      isPublicView: false
    };
    mockRepository.createLyric.mockResolvedValue(mockLyric);

    const event = createMockEvent({
      body: JSON.stringify({
        title: 'Test Song',
        artist: 'Test Artist',
        text: 'Test lyrics'
      })
    });

    const result = await createLyricHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body as string)).toEqual(mockLyric);
  });

  it('should return 400 when body is missing', async () => {
    const event = createMockEvent({ body: undefined });

    const result = await createLyricHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body as string).message).toBe('Missing body');
  });

  it('should return 400 when body is invalid JSON', async () => {
    const event = createMockEvent({ body: 'invalid json' });

    const result = await createLyricHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body as string).message).toBe('Invalid JSON payload');
  });

  it('should return 400 when validation fails', async () => {
    const event = createMockEvent({
      body: JSON.stringify({
        title: '', // empty title should fail validation
        artist: 'Test Artist',
        text: 'Test lyrics'
      })
    });

    const result = await createLyricHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body as string).code).toBe('VALIDATION_ERROR');
  });
});

describe('getLyricHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ALLOWED_ORIGIN = 'https://test.example.com';
  });

  it('should get a lyric successfully', async () => {
    const mockLyric = {
      docId: 'doc-123',
      ownerId: 'user-123',
      title: 'Test Song',
      artist: 'Test Artist',
      text: 'Test lyrics',
      version: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      isPublicView: false,
      annotations: []
    };
    mockRepository.getLyric.mockResolvedValue(mockLyric);

    const event = createMockEvent({
      pathParameters: { docId: 'doc-123' }
    });

    const result = await getLyricHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toEqual(mockLyric);
  });

  it('should return 400 when docId is missing', async () => {
    const event = createMockEvent({
      pathParameters: {}
    });

    const result = await getLyricHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body as string).message).toBe('Missing docId');
  });
});

describe('listLyricsHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ALLOWED_ORIGIN = 'https://test.example.com';
  });

  it('should list lyrics with mine=true', async () => {
    const mockLyrics = [
      { docId: 'doc-1', title: 'Song 1' },
      { docId: 'doc-2', title: 'Song 2' }
    ];
    mockRepository.listLyrics.mockResolvedValue(mockLyrics);

    const event = createMockEvent({
      queryStringParameters: { mine: 'true' }
    });

    const result = await listLyricsHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toEqual(mockLyrics);
  });

  it('should return 400 when mine is not true', async () => {
    const event = createMockEvent({
      queryStringParameters: {}
    });

    const result = await listLyricsHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body as string).message).toContain('mine=true');
  });
});

describe('updateLyricHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ALLOWED_ORIGIN = 'https://test.example.com';
  });

  it('should update a lyric successfully', async () => {
    const mockUpdated = {
      docId: 'doc-123',
      title: 'Updated Title',
      artist: 'Updated Artist',
      text: 'Updated lyrics',
      version: 2
    };
    mockRepository.updateLyric.mockResolvedValue(mockUpdated);

    const event = createMockEvent({
      pathParameters: { docId: 'doc-123' },
      headers: { 'x-doc-version': '1' },
      body: JSON.stringify({
        title: 'Updated Title',
        artist: 'Updated Artist',
        text: 'Updated lyrics',
        version: 1
      })
    });

    const result = await updateLyricHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toEqual(mockUpdated);
  });
});

describe('deleteLyricHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ALLOWED_ORIGIN = 'https://test.example.com';
  });

  it('should delete a lyric successfully', async () => {
    mockRepository.deleteLyric.mockResolvedValue(undefined);

    const event = createMockEvent({
      pathParameters: { docId: 'doc-123' }
    });

    const result = await deleteLyricHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(204);
  });
});

describe('shareLyricHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ALLOWED_ORIGIN = 'https://test.example.com';
  });

  it('should share a lyric successfully', async () => {
    const mockShared = {
      docId: 'doc-123',
      isPublicView: true
    };
    mockRepository.shareLyric.mockResolvedValue(mockShared);

    const event = createMockEvent({
      pathParameters: { docId: 'doc-123' },
      body: JSON.stringify({ isPublicView: true })
    });

    const result = await shareLyricHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string).isPublicView).toBe(true);
  });
});

describe('createAnnotationHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ALLOWED_ORIGIN = 'https://test.example.com';
  });

  it('should create an annotation successfully', async () => {
    const mockAnnotation = {
      annotationId: 'ann-123',
      docId: 'doc-123',
      start: 0,
      end: 5,
      tag: 'vibrato'
    };
    mockRepository.createAnnotation.mockResolvedValue(mockAnnotation);

    const event = createMockEvent({
      pathParameters: { docId: 'doc-123' },
      body: JSON.stringify({
        start: 0,
        end: 5,
        tag: 'vibrato'
      })
    });

    const result = await createAnnotationHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body as string)).toEqual(mockAnnotation);
  });
});

describe('updateAnnotationHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ALLOWED_ORIGIN = 'https://test.example.com';
  });

  it('should update an annotation successfully', async () => {
    const mockUpdated = {
      annotationId: 'ann-123',
      docId: 'doc-123',
      start: 0,
      end: 10,
      tag: 'scoop'
    };
    mockRepository.updateAnnotation.mockResolvedValue(mockUpdated);

    const event = createMockEvent({
      pathParameters: { docId: 'doc-123', annotationId: 'ann-123' },
      body: JSON.stringify({
        start: 0,
        end: 10,
        tag: 'scoop'
      })
    });

    const result = await updateAnnotationHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toEqual(mockUpdated);
  });

  it('should return 400 when path parameters are missing', async () => {
    const event = createMockEvent({
      pathParameters: { docId: 'doc-123' }, // missing annotationId
      body: JSON.stringify({
        start: 0,
        end: 10,
        tag: 'scoop'
      })
    });

    const result = await updateAnnotationHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body as string).message).toBe('Missing path parameters');
  });
});

describe('deleteAnnotationHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ALLOWED_ORIGIN = 'https://test.example.com';
  });

  it('should delete an annotation successfully', async () => {
    mockRepository.deleteAnnotation.mockResolvedValue(undefined);

    const event = createMockEvent({
      pathParameters: { docId: 'doc-123', annotationId: 'ann-123' }
    });

    const result = await deleteAnnotationHandler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(204);
  });
});
