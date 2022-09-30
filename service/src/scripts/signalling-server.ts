import "dotenv/config";
import { sigServer } from '@libp2p/webrtc-star-signalling-server'
import { exit } from 'process';
import { archLogger } from '../utils/chalk-theme';

if (!process.env.DEV_SIGNAL_SERVER_PORT) {
    archLogger.error("DEV_SIGNAL_SERVER_PORT not set in .env\nAdd this environment variable to set the port the local signalling server listens on");
    exit();
}

export const starServerPort = Number.parseInt(process.env.DEV_SIGNAL_SERVER_PORT);
if (Number.isNaN(starServerPort)) {
    archLogger.error("DEV_SIGNAL_SERVER_PORT  .env is not a valid integer");
    exit();
}

await sigServer({
    port: starServerPort,
    host: '127.0.0.1',
    metrics: true,
});

archLogger.notice(`\nLocal star signalling server started on http://localhost:${starServerPort} ...\n`);
