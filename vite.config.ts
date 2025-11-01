import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import packageJson from './package.json';
import { VitePWA } from 'vite-plugin-pwa';
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { nodePolyfills } from "vite-plugin-node-polyfills";
export default defineConfig({
  plugins: [
    solidPlugin(),
    VitePWA({
      srcDir: "/",
      filename: "imageCacheWorker.js",
      strategies: "injectManifest",
      injectRegister: false,
      manifest: false,
      injectManifest: {
        injectionPoint: undefined,
      },
      devOptions: {
        enabled: true,
        type: 'module',
        /* other options */
      }
    }),
    wasm(),
    topLevelAwait(),
    nodePolyfills()
  ],
  server: {
    port: 3000,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    manifest: true,
  },
  envPrefix: 'PRIMAL_',
  define: {
    'import.meta.env.PRIMAL_VERSION': JSON.stringify(packageJson.version),
  },
  esbuild: {
    keepNames: true,
  },
});
