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
##### Generate a Peer ID file for your node
`npm peer-id-gen`

_This only needs to be run once_

---
##### Build and Start
`npm run build`

_There are some typescript errors when building (these are in libp2p core modules).
The service will still build despite these typescript errors._

`npm run start`

##### Approve
Before your node can execute any contract call that sends SARCO token to the contract, you must
approve the contract's spending SARCO on your behalf. This is a standard step. To do this, run:
`npm run approve`

##### Command Line Arguments
Certain arguments may be passed into the process to trigger certain tasks on node startup.

To use, run:
`npm run start -- --<arg-name1>:<value1> <arg-name2>:<value2> <arg-name3>:`

Multiple arguments:
`npm run start -- --<arg-name1>:<value1> <arg-name2>:<value2>` <-- Do not repeat `--` for each argument

Argument without a value:
`npm run start -- --<arg>:`  <-- Note the trailing `:`!!

**Available arguments**
- `deposit-bond:<amount>`

Deposit `<amount>` SARCO tokens to your free bond. Be sure to approve spending before using this argument.


- `withdraw-bond:<amount>`

Withrdraw `<amount>` SARCO tokens from your available free bond


- `withdraw-reward:<amount>`

Withrdraw `<amount>` SARCO tokens from your earned reward pool


- `free-bond:`

Output how much free bond you have deposited in the contract


- `rewards:`

Output how much rewards you have accumulated


- `q:` or `exit:` or `end:` or `quit:`

Indicate that the process should termite as soon as other commands have completed

---

## Notes
Both the signalling server and boostrap node list are using live services.

If you would like to setup your own (or additional) signalling servers, see the guide here:
https://github.com/libp2p/js-libp2p-webrtc-star/blob/master/packages/webrtc-star-signalling-server/DEPLOYMENT.md
