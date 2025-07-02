// // vite.config.ts
// import { defineConfig } from 'vite';
// import { nodePolyfills } from 'vite-plugin-node-polyfills';
// import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
// import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';

// export default defineConfig({
//   plugins: [
//     // Polyfill de Node core modules para browser
//     nodePolyfills(),                                    // rollup-plugin-node-polyfills :contentReference[oaicite:3]{index=3}
//   ],
//   resolve: {
//     alias: {
//       // Alias de globals
//       global: 'globalThis'
//     }
//   },
//   optimizeDeps: {
//     esbuildOptions: {
//       define: {
//         global: 'globalThis'
//       },
//       plugins: [
//         // Polyfills de process y Buffer en dev
//         NodeGlobalsPolyfillPlugin({ process: true, buffer: true }),  :contentReference[oaicite:4]{index=4}
//         NodeModulesPolyfillPlugin()                                  :contentReference[oaicite:5]{index=5}
//       ]
//     }
//   },
//   ssr: {
//     // Evita externalizar Firebase compat en SSR
//     noExternal: ['firebase/compat', '@firebase/compat']             :contentReference[oaicite:6]{index=6}
//   }
// });
