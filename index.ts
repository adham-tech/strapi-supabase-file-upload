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
      const fileDirectory = `${directory}${fileNameWithoutExt}/`;
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
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      file.url = urlData.publicUrl;
    },

    async uploadStream(file: StrapiFile): Promise<void> {
      return this.upload(file);
    },

    async delete(file: StrapiFileForDelete): Promise<void> {
      const filePath = file.url.split(`/${bucket}/`)[1];
      if (!filePath) {
        throw new Error('Invalid file URL');
      }

      const { error } = await supabase.storage.from(bucket).remove([filePath]);

      if (error) throw error;
    },
  };
}

// For backward compatibility with CommonJS
export default { init };
