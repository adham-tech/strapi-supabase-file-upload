# Strapi Supabase file upload

[![npm version](https://badge.fury.io/js/strapi-supabase-file-upload.svg)](https://badge.fury.io/js/strapi-supabase-file-upload)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

_This was created with intent to be for private use, but I thought someone else might find it useful_

**A TypeScript-based [Supabase](https://supabase.com/) Storage upload provider for Strapi 5 CMS.**

## Features

- ✅ **File Organization** - Automatic files organization by name under a folder _(for example Strapi uploads multi sizes images of the original one using sharp so they can be used inside the CMS like thumbnails, this will add theme all under one folder with the name of the image)_
- ✅ **Stream & Buffer Support** - Handles both stream and buffer uploads
- ✅ **File Deletion** - Complete file lifecycle management
- ✅ **v5 Compatible** - Works with latest major Strapi versions

## Installation

```bash
npm install strapi-supabase-file-upload
# or
yarn add strapi-supabase-file-upload
```

## Configuration

Add the provider configuration to your `config/plugins.ts`:

```typescript
export default ({ env }) => ({
  upload: {
    config: {
      provider: 'strapi-supabase-file-upload',
      providerOptions: {
        apiUrl: env('SUPABASE_URL'),
        apiKey: env('SUPABASE_ANON_KEY'),
        bucket: env('SUPABASE_BUCKET'),
        directory: env('SUPABASE_DIRECTORY', ''),
      },
    },
  },
});
```

## Environment Variables

| Variable             | Description                 | Default  |
| -------------------- | --------------------------- | -------- |
| `SUPABASE_URL`       | Your Supabase project URL   | Required |
| `SUPABASE_ANON_KEY`  | Your Supabase anonymous key | Required |
| `SUPABASE_BUCKET`    | Storage bucket name         | Required |
| `SUPABASE_DIRECTORY` | Optional directory prefix   | Optional |

## Usage

### Basic Setup

1. You need your Supabase credentials
2. Create a storage bucket in Supabase
3. Configure the provider as shown above
4. Upload files through Strapi's media library

### File Organization

Files are automatically organized by name:

- `image.jpg` → `image/image.jpg`
- `document.pdf` → `document/document.pdf`

### Security Configuration

You need to update Strapi's security configuration to allow images from your Supabase domain. Add the following to your `config/middlewares.ts`:

```typescript
export default [
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        directives: {
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'https://your-project.supabase.co', // Replace with your Supabase URL
          ],
        },
      },
    },
  },
  // ... other middlewares
];
```

**Important**: Replace `https://your-project.supabase.co` with your actual Supabase project URL _(this also could be a self hosted URL)_.

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Watch for changes
npm run dev

# Format code
npm run format

# Lint code
npm run lint
```

# Future Plans

Maybe make the folder organization optional, only for images, or enabled for all

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Tip

If for some reason you don't want to use an NPM package you can simply copy the content of `index.ts` and the types `types.ts`. Then follow Strapi docs on how to add a provider to your project.

## Support

- 📖 [Documentation](https://github.com/adham-tech/strapi-supabase-file-upload#readme)
- 🐛 [Report a Bug or Suggestions ](https://github.com/adham-tech/strapi-supabase-file-upload/issues)
