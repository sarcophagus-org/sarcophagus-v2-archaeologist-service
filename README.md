# Local Development Guide
To work with the archaeologist server locally, you'll need to configure a local hardhat network and deploy the sarcophagus v2 smart contracts.

This guide assumes an existing installation of nvm. 
https://github.com/nvm-sh/nvm#installing-and-updating
## Deploy smart contracts to hardhat network
```bash
git clone https://github.com/sarcophagus-org/sarcophagus-v2-contracts.git
cd sarcophagus-v2-contracts/

nvm use
npm i 
npx hardhat compile

# deploys contracts to local network, prints accounts controlled by hardhat
npx hardhat node 

# optionally obtain a console to interact with the local network
# npx hardhat console --network localhost
```

## Configure archaeologist service
```bash
git clone https://github.com/sarcophagus-org/sarcophagus-v2-archaeologist-service.git

cd service
nvm use 
npm i

# initialize a .env file
cp .env.example .env
```

### Set Environment Variables
- Set `SARCO_DIAMOND_ADDRESS` and `SARCO_TOKEN_ADDRESS` contract addresses. They can be found in generated files in the contract repo which are created after the contracts are deployed.
  - sarcophagus-v2-contracts/deployments/localhost/Diamond.json
  - sarcophagus-v2-contracts/deployments/localhost/SarcoTokenMock.json
- Set `ETH_PRIVATE_KEY` to a private key corresponding to an account controlled by hardhat runner. All accounts and private keys are printed after running `npx hardhat node` in the sarcophagus-v2-contracts

```bash
# generate a libp2p peerId to be used by the archaeologist node
npm run peer-id-gen 

# compile typescript
npm run build

# authorize the Sarcophagus contracts to spend SARCO on behalf of the node's ethereum account
npm run approve

# register the archaeologist node with the Sarcophagus contracts
npm run register -- --digging-fee:<fee> rewrap-interval:<interval>
```