import type { Stream } from 'node:stream';

export interface SupabaseProviderOptions {
  apiUrl: string;
  apiKey: string;
  bucket: string;
  directory?: string;
}

export interface StrapiFile {
  hash: string;
  ext: string;
  buffer?: Buffer;
  stream?: Stream;
  mime: string;
  url: string;
  name?: string;
}

export interface StrapiFileForDelete {
  url: string;
}

export interface UploadProvider {
  upload(file: StrapiFile): Promise<void>;
  uploadStream(file: StrapiFile): Promise<void>;
  delete(file: StrapiFileForDelete): Promise<void>;
}
