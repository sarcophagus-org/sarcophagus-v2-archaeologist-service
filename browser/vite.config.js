import nodePolyfills from 'rollup-plugin-polyfill-node';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'

export default {
  resolve: {
    alias: {
      util: 'rollup-plugin-node-polyfills/polyfills/util',
      process: 'rollup-plugin-node-polyfills/polyfills/process-es6'
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      },
      // Enable esbuild polyfill plugins
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true
        }),
      ]
    }
  },
  define: {
    "global": {},
    'process.env.NODE_DEBUG': undefined
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      plugins: [
        // Enable rollup polyfills plugin
        // used during production bundling
        nodePolyfills()
      ]
    }
  },
  server: {
    port: 3001
  }
}