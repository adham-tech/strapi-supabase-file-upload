import type { Stream } from 'node:stream';
import type {
  SupabaseProviderOptions,
  StrapiFile,
  StrapiFileForDelete,
  UploadProvider,
} from './types.ts';

import { createClient } from '@supabase/supabase-js';

function streamToBuffer(stream: Stream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

export function init(providerOptions: SupabaseProviderOptions): UploadProvider {
  const supabase = createClient(providerOptions.apiUrl, providerOptions.apiKey);
  const bucket = providerOptions.bucket;
  const directory = providerOptions.directory || '';

  return {
    async upload(file: StrapiFile): Promise<void> {
      const fileName = file.name || `${file.hash}${file.ext}`;
      const fileNameWithoutExt = (file.name || file.hash).replace(
        /\.[^/.]+$/,
        ''
      );

      const baseName = fileNameWithoutExt.replace(
        /^(thumbnail_|large_|medium_|small_)/,
        ''
      );
      const fileDirectory = `${directory}${baseName}/`;
      const filePath = `${fileDirectory}${fileName}`;

      let fileContent = file.buffer;
      if (!fileContent && file.stream) {
        fileContent = await streamToBuffer(file.stream);
      }

      if (!fileContent) {
        throw new Error('No file content provided');
      }

      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileContent, {
          contentType: file.mime,
          upsert: true,
        });

      if (error) throw error;

      file.url = `${providerOptions.apiUrl}/storage/v1/object/public/${bucket}/${filePath}`;
    },

    async uploadStream(file: StrapiFile): Promise<void> {
      return this.upload(file);
    },

    async delete(file: StrapiFileForDelete): Promise<void> {
      const urlParts = file.url.split(`/storage/v1/object/public/${bucket}/`);
      const filePath = urlParts[1];

      if (!filePath) {
        throw new Error('Invalid file URL - cannot extract file path');
      }

      const { error } = await supabase.storage.from(bucket).remove([filePath]);

      if (error) throw error;
    },
  };
}

export default { init };
