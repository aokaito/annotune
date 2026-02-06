import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHttpApi, ApiError } from '../client';

describe('createHttpApi', () => {
  const mockFetch = vi.fn();
  const mockGetIdToken = vi.fn();
  const mockGetExpiresAt = vi.fn();

  const createApi = () =>
    createHttpApi({
      baseUrl: 'https://api.example.com',
      getIdToken: mockGetIdToken,
      getExpiresAt: mockGetExpiresAt,
      fetchImpl: mockFetch
    });

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetIdToken.mockReturnValue('valid-token');
    mockGetExpiresAt.mockReturnValue(Date.now() + 3600000); // 1 hour from now
  });

  describe('listLyrics', () => {
    it('should fetch lyrics list', async () => {
      const mockLyrics = [
        { docId: 'doc-1', title: 'Song 1', artist: 'Artist 1' },
        { docId: 'doc-2', title: 'Song 2', artist: 'Artist 2' }
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve(JSON.stringify(mockLyrics))
      });

      const api = createApi();
      const result = await api.listLyrics('user-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/lyrics?mine=true',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token'
          })
        })
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('createLyric', () => {
    it('should create a new lyric', async () => {
      const mockLyric = {
        docId: 'doc-123',
        title: 'New Song',
        artist: 'Artist',
        text: 'Lyrics text'
      };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve(JSON.stringify(mockLyric))
      });

      const api = createApi();
      const result = await api.createLyric('user-123', {
        title: 'New Song',
        artist: 'Artist',
        text: 'Lyrics text'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/lyrics',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            title: 'New Song',
            artist: 'Artist',
            text: 'Lyrics text'
          })
        })
      );
      expect(result.docId).toBe('doc-123');
    });
  });

  describe('getLyric', () => {
    it('should fetch a single lyric', async () => {
      const mockLyric = {
        docId: 'doc-123',
        title: 'Test Song',
        annotations: []
      };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve(JSON.stringify(mockLyric))
      });

      const api = createApi();
      const result = await api.getLyric('doc-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/lyrics/doc-123',
        expect.anything()
      );
      expect(result?.docId).toBe('doc-123');
    });

    it('should return undefined for 404', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve(JSON.stringify({ message: 'Not found' }))
      });

      const api = createApi();
      const result = await api.getLyric('doc-123');

      expect(result).toBeUndefined();
    });
  });

  describe('getPublicLyric', () => {
    it('should fetch a public lyric without authentication', async () => {
      const mockLyric = {
        docId: 'doc-123',
        title: 'Public Song',
        isPublicView: true
      };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve(JSON.stringify(mockLyric))
      });

      const api = createApi();
      await api.getPublicLyric('doc-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/public/lyrics/doc-123',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.anything()
          })
        })
      );
    });
  });

  describe('searchPublicLyrics', () => {
    it('should search public lyrics with query', async () => {
      const mockLyrics = [{ docId: 'doc-1', title: 'Match' }];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve(JSON.stringify(mockLyrics))
      });

      const api = createApi();
      const result = await api.searchPublicLyrics({ title: 'Match' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('title=Match'),
        expect.anything()
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('updateLyric', () => {
    it('should update a lyric with version header', async () => {
      const mockUpdated = {
        docId: 'doc-123',
        title: 'Updated Title',
        version: 2
      };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve(JSON.stringify(mockUpdated))
      });

      const api = createApi();
      const result = await api.updateLyric('doc-123', {
        title: 'Updated Title',
        artist: 'Artist',
        text: 'Text',
        version: 1
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/lyrics/doc-123',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'X-Doc-Version': '1'
          })
        })
      );
      expect(result.version).toBe(2);
    });
  });

  describe('deleteLyric', () => {
    it('should delete a lyric', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        headers: new Headers(),
        text: () => Promise.resolve('')
      });

      const api = createApi();
      await api.deleteLyric('doc-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/lyrics/doc-123',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('shareLyric', () => {
    it('should toggle public visibility', async () => {
      const mockShared = { docId: 'doc-123', isPublicView: true };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve(JSON.stringify(mockShared))
      });

      const api = createApi();
      const result = await api.shareLyric('doc-123', true);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/lyrics/doc-123/share',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ isPublicView: true })
        })
      );
      expect(result.isPublicView).toBe(true);
    });
  });

  describe('createAnnotation', () => {
    it('should create an annotation', async () => {
      const mockAnnotation = {
        annotationId: 'ann-123',
        start: 0,
        end: 5,
        tag: 'vibrato'
      };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve(JSON.stringify(mockAnnotation))
      });

      const api = createApi();
      const result = await api.createAnnotation('doc-123', 'user-123', {
        start: 0,
        end: 5,
        tag: 'vibrato'
      });

      expect(result.annotationId).toBe('ann-123');
    });
  });

  describe('authentication errors', () => {
    it('should throw when token is missing', async () => {
      mockGetIdToken.mockReturnValue(null);

      const api = createApi();

      await expect(api.listLyrics('user-123')).rejects.toThrow(ApiError);
      await expect(api.listLyrics('user-123')).rejects.toThrow('Authentication credentials missing');
    });

    it('should throw when token is expired', async () => {
      mockGetExpiresAt.mockReturnValue(Date.now() - 1000); // expired

      const api = createApi();

      await expect(api.listLyrics('user-123')).rejects.toThrow(ApiError);
      await expect(api.listLyrics('user-123')).rejects.toThrow('Authentication token has expired');
    });
  });

  describe('error handling', () => {
    it('should throw ApiError on non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve(JSON.stringify({ message: 'Server error' }))
      });

      const api = createApi();

      await expect(api.listLyrics('user-123')).rejects.toThrow(ApiError);
      await expect(api.listLyrics('user-123')).rejects.toThrow('Server error');
    });

    it('should throw ApiError on invalid JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve('not json')
      });

      const api = createApi();

      await expect(api.listLyrics('user-123')).rejects.toThrow('Failed to parse server response');
    });
  });

  describe('versions', () => {
    it('should list versions', async () => {
      const mockVersions = [
        { docId: 'doc-123', version: 2, title: 'V2' },
        { docId: 'doc-123', version: 1, title: 'V1' }
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve(JSON.stringify(mockVersions))
      });

      const api = createApi();
      const result = await api.listVersions('doc-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/lyrics/doc-123/versions',
        expect.anything()
      );
      expect(result).toHaveLength(2);
    });

    it('should get a specific version', async () => {
      const mockVersion = { docId: 'doc-123', version: 1, title: 'V1' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve(JSON.stringify(mockVersion))
      });

      const api = createApi();
      const result = await api.getVersion('doc-123', 1);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/lyrics/doc-123/versions/1',
        expect.anything()
      );
      expect(result?.version).toBe(1);
    });
  });
});
