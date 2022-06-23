## Getting started
##### Setup env file
`cp .env.example .env`

Configure the .env file as necessary:
1. If running this locally, use 127.0.0.1 as the `IP_ADDRESS`, otherwise use your server's public ip address.
2. If you would like to run the node as a bootstrap node, set `IS_BOOSTRAP=true`

---
##### Install dependencies
`nvm use && npm install`

---
##### Generate Peer ID file
`npm peer-id-gen`

_This only needs to be run once_

---
##### Build and Start
`npm run build`

_There are some typescript errors when building (these are in libp2p core modules).
The service will still build despite these typescript errors._

`npm run start`

---

## Notes
Both the signalling server and boostrap node list are using live services.

If you would like to setup your own (or additional) signalling servers, see the guide here:
https://github.com/libp2p/js-libp2p-webrtc-star/blob/master/packages/webrtc-star-signalling-server/DEPLOYMENT.md
