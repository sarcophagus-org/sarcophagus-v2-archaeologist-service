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
  // optimizeDeps: {
  //   exclude: [
  //     '@libp2p/pubsub-peer-discovery'
  //   ]
  // }
}