import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StrapiFile, StrapiFileForDelete, UploadProvider } from '../types';
import { Readable } from 'node:stream';
import { init } from '../index';

// Mock helpers
const createMockFileWithBuffer = (
  options?: Partial<StrapiFile>
): StrapiFile => ({
  hash: 'test-hash',
  ext: '.jpg',
  mime: 'image/jpeg',
  buffer: Buffer.from('test image content'),
  url: '',
  name: 'test.jpg',
  ...options,
});

const createMockFileWithStream = (
  options?: Partial<StrapiFile>
): StrapiFile => {
  const stream = new Readable();
  stream.push('test image content');
  stream.push(null);

  return {
    hash: 'test-hash',
    ext: '.jpg',
    mime: 'image/jpeg',
    stream,
    url: '',
    name: 'test.jpg',
    ...options,
  };
};

const createMockFileForDelete = (url: string): StrapiFileForDelete => ({
  url,
});

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => {
  const mockUpload = vi.fn().mockResolvedValue({ error: null });
  const mockRemove = vi.fn().mockResolvedValue({ error: null });
  const mockGetPublicUrl = vi.fn().mockReturnValue({
    data: { publicUrl: 'https://example.com/bucket/test/test.jpg' },
  });

  return {
    createClient: () => ({
      storage: {
        from: () => ({
          upload: mockUpload,
          remove: mockRemove,
          getPublicUrl: mockGetPublicUrl,
        }),
      },
    }),
  };
});

describe('Supabase Upload Provider', () => {
  let uploadProvider: UploadProvider;

  describe('initialization', () => {
    it('should initialize with required options', () => {
      uploadProvider = init({
        apiUrl: 'https://example.supabase.co',
        apiKey: 'test-api-key',
        bucket: 'test-bucket',
      });

      expect(uploadProvider).toBeDefined();
      expect(typeof uploadProvider.upload).toBe('function');
      expect(typeof uploadProvider.uploadStream).toBe('function');
      expect(typeof uploadProvider.delete).toBe('function');
    });

    it('should initialize with directory option', () => {
      uploadProvider = init({
        apiUrl: 'https://example.supabase.co',
        apiKey: 'test-api-key',
        bucket: 'test-bucket',
        directory: 'uploads/',
      });

      expect(uploadProvider).toBeDefined();
    });
  });

  describe('upload', () => {
    beforeEach(() => {
      uploadProvider = init({
        apiUrl: 'https://example.supabase.co',
        apiKey: 'test-api-key',
        bucket: 'test-bucket',
        directory: 'uploads/',
      });
    });

    it('should upload a file with buffer', async () => {
      const file = createMockFileWithBuffer();

      await uploadProvider.upload(file);

      expect(file.url).toBe('https://example.com/bucket/test/test.jpg');
    });

    it('should upload a file with stream', async () => {
      const file = createMockFileWithStream();

      await uploadProvider.upload(file);

      expect(file.url).toBe('https://example.com/bucket/test/test.jpg');
    });

    it('should throw error when no content is provided', async () => {
      const file: StrapiFile = {
        hash: 'test-hash',
        ext: '.jpg',
        mime: 'image/jpeg',
        url: '',
        name: 'test.jpg',
      };

      await expect(uploadProvider.upload(file)).rejects.toThrow(
        'No file content provided'
      );
    });

    it('should use hash and ext when name is not provided', async () => {
      const file = createMockFileWithBuffer({
        name: undefined,
      });

      await uploadProvider.upload(file);

      expect(file.url).toBe('https://example.com/bucket/test/test.jpg');
    });

    it('should handle file with extension in name', async () => {
      const file = createMockFileWithBuffer({
        name: 'test.jpg',
      });

      await uploadProvider.upload(file);

      expect(file.url).toBe('https://example.com/bucket/test/test.jpg');
    });

    it('should handle upload errors from Supabase', async () => {
      // Mock Supabase error for this test only
      const mockError = new Error('Upload failed');

      vi.spyOn(uploadProvider, 'upload').mockImplementationOnce(async _file => {
        const result = { error: mockError };
        if (result.error) throw result.error;
      });

      const file = createMockFileWithBuffer();

      await expect(uploadProvider.upload(file)).rejects.toThrow(
        'Upload failed'
      );
    });
  });

  describe('uploadStream', () => {
    beforeEach(() => {
      uploadProvider = init({
        apiUrl: 'https://example.supabase.co',
        apiKey: 'test-api-key',
        bucket: 'test-bucket',
      });
    });

    it('should call upload method', async () => {
      const file = createMockFileWithBuffer();

      const uploadSpy = vi.spyOn(uploadProvider, 'upload');
      await uploadProvider.uploadStream(file);

      expect(uploadSpy).toHaveBeenCalledWith(file);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      uploadProvider = init({
        apiUrl: 'https://example.supabase.co',
        apiKey: 'test-api-key',
        bucket: 'test-bucket',
      });
    });

    it('should delete a file', async () => {
      const file = createMockFileForDelete(
        'https://example.com/test-bucket/test/test.jpg'
      );

      await uploadProvider.delete(file);
      // If no error is thrown, the test passes
    });

    it('should throw error for invalid URL', async () => {
      const file = createMockFileForDelete('https://example.com/invalid-url');

      await expect(uploadProvider.delete(file)).rejects.toThrow(
        'Invalid file URL'
      );
    });

    it('should handle delete errors from Supabase', async () => {
      // Mock Supabase error for this test only
      const mockError = new Error('Delete failed');

      vi.spyOn(uploadProvider, 'delete').mockImplementationOnce(async _file => {
        throw mockError;
      });

      const file = createMockFileForDelete(
        'https://example.com/test-bucket/test/test.jpg'
      );

      await expect(uploadProvider.delete(file)).rejects.toThrow(
        'Delete failed'
      );
    });
  });
});
