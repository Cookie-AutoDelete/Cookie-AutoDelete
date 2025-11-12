import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig, UserConfig } from 'vite';
import manifestJson from './manifest.json';
import packageJson from './package.json';
import * as DIR from './tools/directories';

const dirname = import.meta.dirname || new URL('.', import.meta.url).pathname;

type FixEmailFields<T> = {
  [TKey in keyof T]: TKey extends 'author' ? { email: string } : T[TKey];
};

type Browser = 'firefox' | 'chrome';

export default defineConfig(({ mode }) => {
  const browser: Browser = (process.env.BROWSER as Browser) ?? 'chrome';

  const manifest = {
    ...manifestJson,
    version: packageJson.version,
  } as unknown as FixEmailFields<typeof manifestJson>;

  if (browser === 'chrome' && mode === 'development') {
    manifest.permissions.splice(
      manifest.permissions.indexOf('contextualIdentities'),
      1,
    );
    delete manifest.browser_specific_settings;
  }

  return {
    publicDir: resolve(dirname, DIR.EXT),
    root: resolve(dirname, 'src'),
    build: {
      outDir: resolve(dirname, DIR.DIST),
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (
              id.includes('react') ||
              id.includes('redux') ||
              id.includes('fontawsome')
            ) {
              return 'react';
            }
            if (id.includes('webextension-polyfill')) {
              return 'webextension-polyfill';
            }
          },
        },
      },
    },
    plugins: [react(), crx({ manifest })],
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: [
            'import',
            'color-functions',
            'global-builtin',
          ],
        },
      },
    },
    server: {
      cors: {
        origin: [/chrome-extension:\/\//],
      },
      strictPort: true,
      port: 5173,
      hmr: {
        clientPort: 5173,
      },
    },
  } satisfies UserConfig;
});
