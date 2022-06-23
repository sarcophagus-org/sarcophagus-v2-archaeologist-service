import nodePolyfills from 'rollup-plugin-polyfill-node';

export default {
  build: {
    target: 'es2020',
    rollupOptions: {
      plugins: [nodePolyfills()],
    },
  },
  define: {
    "global": {},
  },
  server: {
    port: 3001
  }
}