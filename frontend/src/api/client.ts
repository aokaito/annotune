import type { Annotation, LyricDocument, LyricVersionSnapshot } from '../types';
import {
  ApiError,
  type AnnotuneApi,
  type AnnotationPayload,
  type CreateLyricPayload,
  type UpdateLyricPayload
} from './types';

export interface HttpApiConfig {
  baseUrl: string;
  getIdToken: () => string | null;
  getExpiresAt?: () => number | null;
  fetchImpl?: typeof fetch;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  auth?: boolean;
};

type AnnotationResponse = {
  annotationId: string;
  start: number;
  end: number;
  tag: Annotation['tag'];
  comment?: string;
  props?: Annotation['props'];
  authorId: string;
  createdAt: string;
  updatedAt: string;
  docId?: string;
  version?: number;
};

type LyricResponse = {
  docId: string;
  ownerId: string;
  ownerName?: string;
  title: string;
  artist?: string;
  text: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  isPublicView: boolean;
  annotations?: AnnotationResponse[];
};

const toAnnotation = (payload: AnnotationResponse): Annotation => ({
  annotationId: payload.annotationId,
  start: payload.start,
  end: payload.end,
  tag: payload.tag,
  comment: payload.comment,
  props: payload.props,
  authorId: payload.authorId,
  createdAt: payload.createdAt,
  updatedAt: payload.updatedAt
});

const toLyricDocument = (payload: LyricResponse): LyricDocument => ({
  docId: payload.docId,
  ownerId: payload.ownerId,
  ownerName: payload.ownerName,
  title: payload.title,
  artist: payload.artist ?? '',
  text: payload.text,
  version: payload.version,
  createdAt: payload.createdAt,
  updatedAt: payload.updatedAt,
  isPublicView: payload.isPublicView,
  annotations: (payload.annotations ?? []).map(toAnnotation)
});

const normalizeVersions = (payload: LyricVersionSnapshot[]): LyricVersionSnapshot[] =>
  payload.map((item) => ({
    docId: item.docId,
    version: item.version,
    title: item.title,
    artist: item.artist ?? '',
    text: item.text,
    createdAt: item.createdAt,
    authorId: item.authorId
  }));

export const createHttpApi = (config: HttpApiConfig): AnnotuneApi => {
  const baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl : `${config.baseUrl}/`;

  const fetchImpl = config.fetchImpl ?? globalThis.fetch?.bind(globalThis);

  if (!fetchImpl) {
    throw new Error('Fetch API is not available in this environment.');
  }

  const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
    const { method = 'GET', body, query, headers = {}, auth = true } = options;
    const url = new URL(path.replace(/^\//, ''), baseUrl);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        url.searchParams.append(key, String(value));
      }
    }

    const finalHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...headers
    };

    let serializedBody: string | undefined;

    if (body !== undefined && body !== null && method !== 'GET') {
      finalHeaders['Content-Type'] = 'application/json';
      serializedBody = JSON.stringify(body);
    }

    if (auth) {
      // トークンの有効期限をチェック
      if (config.getExpiresAt) {
        const expiresAt = config.getExpiresAt();
        if (expiresAt !== null && Date.now() >= expiresAt) {
          throw new ApiError(401, 'Authentication token has expired');
        }
      }

      const token = config.getIdToken();
      if (!token) {
        throw new ApiError(401, 'Authentication credentials missing');
      }
      finalHeaders.Authorization = `Bearer ${token}`;
    }

    const response = await fetchImpl(url.toString(), {
      method,
      headers: finalHeaders,
      body: serializedBody
    });

    const contentType = response.headers.get('content-type') ?? '';
    const rawText = await response.text();

    let parsed: unknown = undefined;

    if (rawText) {
      if (contentType.includes('application/json')) {
        try {
          parsed = JSON.parse(rawText);
        } catch (error) {
          throw new ApiError(response.status, 'Failed to parse server response', {
            rawText,
            error: String(error)
          });
        }
      } else {
        parsed = rawText;
      }
    }

    if (!response.ok) {
      const message =
        typeof parsed === 'object' && parsed && 'message' in parsed
          ? String((parsed as { message: unknown }).message)
          : rawText || `Request failed with status ${response.status}`;
      throw new ApiError(response.status, message, parsed);
    }

    return parsed as T;
  };

  const safeRequest = async <T>(path: string, options?: RequestOptions): Promise<T | undefined> => {
    try {
      return await request<T>(path, options);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return undefined;
      }
      throw error;
    }
  };

  return {
    async listLyrics(_ownerId) {
      const payload =
        (await request<LyricResponse[]>('/v1/lyrics', {
          method: 'GET',
          query: { mine: 'true' }
        })) ?? [];
      return payload.map((item) => toLyricDocument({ ...item, annotations: item.annotations ?? [] }));
    },
    async createLyric(_ownerId: string, payload: CreateLyricPayload) {
      const data = await request<LyricResponse>('/v1/lyrics', {
        method: 'POST',
        body: payload
      });
      return toLyricDocument({ ...data, annotations: data.annotations ?? [] });
    },
    async getLyric(docId: string) {
      const data = await safeRequest<LyricResponse>(`/v1/lyrics/${docId}`);
      return data ? toLyricDocument(data) : undefined;
    },
    async getPublicLyric(docId: string) {
      const data = await safeRequest<LyricResponse>(`/v1/public/lyrics/${docId}`, {
        auth: false
      });
      return data ? toLyricDocument(data) : undefined;
    },
    async searchPublicLyrics(query?: { title?: string; artist?: string }) {
      const payload =
        (await request<LyricResponse[]>('/v1/public/lyrics', {
          method: 'GET',
          query,
          auth: false
        })) ?? [];
      return payload.map((item) =>
        toLyricDocument({ ...item, annotations: item.annotations ?? [] })
      );
    },
    async updateLyric(docId: string, payload: UpdateLyricPayload) {
      const data = await request<LyricResponse>(`/v1/lyrics/${docId}`, {
        method: 'PUT',
        body: {
          title: payload.title,
          artist: payload.artist,
          text: payload.text,
          version: payload.version
        },
        headers: {
          'X-Doc-Version': String(payload.version)
        }
      });
      return toLyricDocument({ ...data, annotations: data.annotations ?? [] });
    },
    async deleteLyric(docId: string) {
      await request<void>(`/v1/lyrics/${docId}`, {
        method: 'DELETE'
      });
    },
    async shareLyric(docId: string, isPublicView: boolean, ownerName?: string) {
      const data = await request<LyricResponse>(`/v1/lyrics/${docId}/share`, {
        method: 'POST',
        body: { isPublicView, ownerName }
      });
      return toLyricDocument({ ...data, annotations: data.annotations ?? [] });
    },
    async createAnnotation(docId: string, _authorId: string, payload: AnnotationPayload) {
      const data = await request<AnnotationResponse>(`/v1/lyrics/${docId}/annotations`, {
        method: 'POST',
        body: payload
      });
      return toAnnotation(data);
    },
    async updateAnnotation(docId: string, annotationId: string, payload: AnnotationPayload) {
      const data = await request<AnnotationResponse>(
        `/v1/lyrics/${docId}/annotations/${annotationId}`,
        {
          method: 'PUT',
          body: payload
        }
      );
      return toAnnotation(data);
    },
    async deleteAnnotation(docId: string, annotationId: string) {
      await request<void>(`/v1/lyrics/${docId}/annotations/${annotationId}`, {
        method: 'DELETE'
      });
    },
    async listVersions(docId: string) {
      const data =
        (await request<LyricVersionSnapshot[]>(`/v1/lyrics/${docId}/versions`)) ?? [];
      return normalizeVersions(data);
    },
    async getVersion(docId: string, version: number) {
      const data = await safeRequest<LyricVersionSnapshot>(
        `/v1/lyrics/${docId}/versions/${version}`
      );
      return data ? normalizeVersions([data])[0] : undefined;
    }
  };
};

export { createMockApi, mockApi } from './mock';
export * from './types';
