## Getting started

## TODO
Add docker instructions

#### Setup env file

`cp .env.example .env`

See example env file for descriptions of env vars.

---

#### Install dependencies

`nvm use && npm install`

---

#### Generate a Peer ID file for your node

`npm run peer-id-gen`

_This only needs to be run once_

---

#### Install CLI

`npm run cli:install`

To see list of commands:
`cli help`

To see options available for any given command:
`cli help <command>`

#### Register your Archaeologist Profile

`cli register --digging-fee:<val> --rewrap-interval:<val>`

_This only needs to be run once_

Replace each `<val>` with the value you would like to set for each item.

- `digging-fee`: This indicates the minimum SARCO tokens you are willing to accept as fee for each rewrap on a sarcophagus.

- `rewrap-interval`: This indicates the maximum time (in seconds) between rewraps you are willing to accept on a Sarcophagus.

While these values may be later updated, the value they are set to during a Curse on a Sarcophagus will remain constant for the lifetime of that Sarcophagus.

- You may optionally run the register script with an additional `free-bond:<val>` argument to have the contract also deposit free bond into your account.

---

#### Updating your Archaeologist Profile

`cli update --digging-fee:<val> --rewrap-interval:<val> --free-bond:<val>`

Replace each `<val>` with the value you would like to set for each item (at least 1)

- `digging-fee`: Optional. The new minimum SARCO tokens you are willing to accept as fee for each rewrap _on all future_ Sarcophgi.

- `rewrap-interval`: Optional. The new maximum time between rewraps you are willing to accept _on all future_ Sarcophagi.

- `free-bond`: Optional. Free bond in SARCO tokens to deposit. Adds to your existing free bond.

---

#### Build and Start

`npm run build`

_There are some typescript errors when building (these are in libp2p core modules).
The service will still build despite these typescript errors._

`npm run start`

This will start up your node and attempt to connect to the signalling servers defined in `SIGNAL_SERVER_LIST` in `.env`.

---

#### Approve

Before your node can execute any contract call that sends SARCO tokens to the contract, you must
approve the contract's spending SARCO on your behalf. This is a standard step. To do this, run:
`npm run approve`

---

#### Startup Command Line Arguments

Certain arguments may be passed into the process to trigger certain tasks on node startup.

To use, run:
`npm run start -- --<arg-name1>:<value1> <arg-name2>:<value2> <arg-name3>:`

Multiple arguments:
`npm run start -- --<arg-name1>:<value1> <arg-name2>:<value2>` <-- Do not repeat `--` for each argument

Argument without a value:
`npm run start -- --<arg>:` <-- Note the trailing `:`!!

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

#### Clean and Accuse

For convenience, scripts are provided for executing the third party clean and accuse contract calls

##### Clean

You may clean a sarcophagus if it has not been unwrapped and it is past its resurrection window.

Run the following command:
`npm run clean -- --id:<sarcophagus-id> pay:<payment-address>`

Replace `<sarcophagud-id>` and `<payment-address>` with the ID of the sarcophagus to clean, and the address
to which you would like rewards to be sent to, respectively.

##### Accuse

You may call accuse on a sarcophagus if you have access to enough of the number of unencrypted shard hashes required to
unwrap the sarcophagus _before_ the time set by its embalmer to unwrap it, because of some sort of leak by the
archaeologists responsible for the sarcophagus.

Run the following command:
`npm run accuse -- --id:<sarcophagus-id> pay:<payment-address> shards-filepath:<path-to-shards-file>`

Replace `<sarcophagud-id>`, `<payment-address>` and `<path-to-shards-file>` with the ID of the sarcophagus to clean, the address
to which you would like rewards to be sent to, and the path to the file containing your proofs, respectively.

The file at `<path-to-shards-file>` should be a `.json` file containing a list of leaked unencrypted shard hashes:

```
[
    "shard1",
    "shard2",
    .
    .
    .
    "shardM",
]
```

---

## Testing

### Local, Multiple Nodes

Use `npm run start:local` to start an instance of the archaeologist node that connects to a locally running signalling server.

This script automatically starts up a local signalling server -- you will need to set the `DEV_SIGNAL_SERVER_PORT`
environment variable in `.env`.

To spin up multiple nodes, run `npm run start:local -- --count:<archCount>`. Replace `<archCount>` with the number of nodes
you would like to start up.

In order to avoid overloading a single thread, it's recommended to start a maximum of 4 or 5 nodes. To test with more, you
may run the script in another terminal. The script will attempt to use the signalling server started in the first terminal.

A side effect of this is you might need to keep track of which terminal/process started up the signalling server, as killing
it would effectively cut of nodes running in other terminals from discovering each other.

---

### Running tests

Set these environment variables:

- `TEST_DEPLOYER_PRIVATE_KEY`: the private key of the deployer - logged in the node's logs (private key of Account #0)
- `TEST_CONTRACTS_DIRECTORY`: absolute path to the directory containing the Sarcophagus Contracts project (https://github.com/sarcophagus-org/sarcophagus-v2-contracts/)
- `TEST_NETWORK_STARTUP_TIME`: Set if needed. This sets a buffer in milliseconds to wait for the network to start and Sarco contracts to finish deploying. Defaults to 6000.

Run `npm run test` to run all tests.
If an exception is thrown indicating that a transaction was reverted without a reason, `TEST_NETWORK_STARTUP_TIME` is probably to low and the network didn't have enough
time to start on your machine. Try re-running the test, or else increase this time.

Test files are loaded from `index.ts` in `service/src/test`.

## Notes

Both the signalling server and boostrap node list are using live services.

If you would like to setup your own (or additional) signalling servers, see the guide here:
https://github.com/libp2p/js-libp2p-webrtc-star/blob/master/packages/webrtc-star-signalling-server/DEPLOYMENT.md
