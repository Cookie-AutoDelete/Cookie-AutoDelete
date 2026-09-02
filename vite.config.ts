import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig, type UserConfig } from 'vite';
import manifestJson from './manifest.json';
import packageJson from './package.json';
import * as DIR from './tools/directories';

const dirname = import.meta.dirname || new URL('.', import.meta.url).pathname;

type Browser = 'firefox' | 'chrome';

function readBrowser(): Browser {
  const browser = process.env.BROWSER;

  if (browser === 'chrome' || browser === 'firefox') {
    return browser;
  }

  throw new Error(
    'BROWSER must be "chrome" or "firefox". Use an npm browser-specific command.',
  );
}

function createManifest(browser: Browser) {
  const manifest = {
    ...manifestJson,
    version: packageJson.version,
  };

  if (browser === 'chrome') {
    const { browser_specific_settings: _firefoxSettings, ...chromeManifest } =
      manifest;

    return {
      ...chromeManifest,
      permissions: manifest.permissions.filter(
        (permission) => permission !== 'contextualIdentities',
      ),
    };
  }
  // browser === 'firefox'

  const serviceWorker = manifest.background?.service_worker;

  if (typeof serviceWorker !== 'string') {
    throw new Error(
      'Firefox build requires background.service_worker in manifest.json.',
    );
  }

  const { minimum_chrome_version: _minimumChromeVersion, ...firefoxManifest } =
    manifest;

  return {
    ...firefoxManifest,
    background: {
      scripts: [serviceWorker],
      type: 'module' as const,
    },
    developer: {
      name: 'median-dxz',
      url: 'https://github.com/median-dxz/Cookie-AutoDelete-MV3',
    },
  };
}

export default defineConfig(() => {
  const browser = readBrowser();
  const manifest = createManifest(browser);

  return {
    publicDir: resolve(dirname, DIR.EXT),
    root: resolve(dirname, 'src'),
    build: {
      outDir: resolve(dirname, `dist`, `${browser}`),
      emptyOutDir: true,
      sourcemap: false,
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
          silenceDeprecations: ['import', 'color-functions', 'global-builtin'],
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
