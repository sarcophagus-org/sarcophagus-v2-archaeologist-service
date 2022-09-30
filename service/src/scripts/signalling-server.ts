import { sigServer } from '@libp2p/webrtc-star-signalling-server'

export const starServerPort = 24642;

await sigServer({
    port: starServerPort,
    host: '127.0.0.1',
    metrics: true,
});

console.log(`\nLocal star signalling server listening on http://localhost:${starServerPort}...\n`);
