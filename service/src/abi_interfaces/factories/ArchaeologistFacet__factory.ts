/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  ArchaeologistFacet,
  ArchaeologistFacetInterface,
} from "../ArchaeologistFacet";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "archaeologist",
        type: "address",
      },
    ],
    name: "ArchaeologistAlreadyUnwrapped",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "archaeologist",
        type: "address",
      },
    ],
    name: "ArchaeologistNotOnSarcophagus",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "cursedBond",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "NotEnoughCursedBond",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "freeBond",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "NotEnoughFreeBond",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "reward",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "NotEnoughReward",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "resurrectionTime",
        type: "uint256",
      },
    ],
    name: "ResurrectionTimeInPast",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "sarcoId",
        type: "bytes32",
      },
    ],
    name: "SarcophagusDoesNotExist",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "sarcoId",
        type: "bytes32",
      },
    ],
    name: "SarcophagusNotFinalized",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "sarcoId",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "signer",
        type: "address",
      },
    ],
    name: "SignerNotArchaeologistOnSarcophagus",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "resurrectionTime",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "currentTime",
        type: "uint256",
      },
    ],
    name: "TooEarlyToUnwrap",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "resurrectionTime",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "resurrectionWindow",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "currentTime",
        type: "uint256",
      },
    ],
    name: "TooLateToUnwrap",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "unencryptedShard",
        type: "bytes",
      },
      {
        internalType: "bytes32",
        name: "doubleHashedShard",
        type: "bytes32",
      },
    ],
    name: "UnencryptedShardHashMismatch",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "archaeologist",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "depositedBond",
        type: "uint256",
      },
    ],
    name: "DepositFreeBond",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32",
        name: "sarcoId",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "string",
        name: "arweaveTxId",
        type: "string",
      },
      {
        indexed: false,
        internalType: "address",
        name: "oldArchaeologist",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newArchaeologist",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "curseTokenId",
        type: "uint256",
      },
    ],
    name: "FinalizeTransfer",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "sarcoId",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "unencryptedShard",
        type: "bytes",
      },
    ],
    name: "UnwrapSarcophagus",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "archaeologist",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "withdrawnBond",
        type: "uint256",
      },
    ],
    name: "WithdrawFreeBond",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "archaeologist",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "withdrawnReward",
        type: "uint256",
      },
    ],
    name: "WithdrawReward",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "depositFreeBond",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "sarcoId",
        type: "bytes32",
      },
      {
        internalType: "string",
        name: "arweaveTxId",
        type: "string",
      },
      {
        components: [
          {
            internalType: "uint8",
            name: "v",
            type: "uint8",
          },
          {
            internalType: "bytes32",
            name: "r",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "s",
            type: "bytes32",
          },
        ],
        internalType: "struct LibTypes.Signature",
        name: "oldArchSignature",
        type: "tuple",
      },
    ],
    name: "finalizeTransfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "sarcoId",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "unencryptedShard",
        type: "bytes",
      },
    ],
    name: "unwrapSarcophagus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdrawFreeBond",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdrawReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506125a2806100206000396000f3fe608060405234801561001057600080fd5b50600436106100575760003560e01c8063364e08011461005c578063523a3f081461007857806369afe1c5146100945780636a5ac74c146100b05780638d58642a146100cc575b600080fd5b61007660048036038101906100719190611a5a565b6100e8565b005b610092600480360381019061008d9190611a5a565b6101e6565b005b6100ae60048036038101906100a99190611ca5565b6102e4565b005b6100ca60048036038101906100c59190611a5a565b61082b565b005b6100e660048036038101906100e19190611db5565b61092b565b005b6100f23382610c45565b6000800160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663a9059cbb33836040518363ffffffff1660e01b8152600401610151929190611e61565b6020604051808303816000875af1158015610170573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101949190611ec2565b503373ffffffffffffffffffffffffffffffffffffffff167fd91b1e491a880123721b161dbbf8249668b0c546077d7ba4d0016441ca9d8f45826040516101db9190611eef565b60405180910390a250565b6101f03382610d77565b6000800160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663a9059cbb33836040518363ffffffff1660e01b815260040161024f929190611e61565b6020604051808303816000875af115801561026e573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102929190611ec2565b503373ffffffffffffffffffffffffffffffffffffffff167fbc84835063c693975166f00cffb19f01a94c2db55b1bf259238c5da3594e5066826040516102d99190611eef565b60405180910390a250565b600160028111156102f8576102f7611f0a565b5b6000600c01600085815260200190815260200160002060010160009054906101000a900460ff16600281111561033157610330611f0a565b5b1461037357826040517f018da68800000000000000000000000000000000000000000000000000000000815260040161036a9190611f48565b60405180910390fd5b61037c83610ea9565b6103bd57826040517f3cb813720000000000000000000000000000000000000000000000000000000081526004016103b49190611f48565b60405180910390fd5b6103df6000600c01600085815260200190815260200160002060020154610edd565b60006103f983836000015184602001518560400151610f24565b90506104058482610fd6565b6104485783816040517fd93ccb2000000000000000000000000000000000000000000000000000000000815260040161043f929190611f63565b60405180910390fd5b60005b6000600c01600086815260200190815260200160002060090180549050811015610583578173ffffffffffffffffffffffffffffffffffffffff166000600c01600087815260200190815260200160002060090182815481106104b1576104b0611f8c565b5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff160361057057336000600c016000878152602001908152602001600020600901828154811061052357610522611f8c565b5b9060005260206000200160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550610583565b808061057b90611fea565b91505061044b565b5061058e8482611048565b600080601101600086815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000209050600080601101600087815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002090508060000154826000018190555080600101548260010181905550806002015482600201819055506040518060200160405280600081525082600301908051906020019061068892919061182f565b5060008160000181905550600081600101819055506000801b8160020181905550604051806020016040528060008152508160030190805190602001906106d092919061182f565b506000600c016000878152602001908152602001600020600401859080600181540180825580915050600190039060005260206000200160009091909190915090805190602001906107239291906118b5565b5061072e8633611196565b8060040154826004018190555060008160040181905550600060010160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663f242432a8433856004015460016040518563ffffffff1660e01b81526004016107ae94939291906120ae565b600060405180830381600087803b1580156107c857600080fd5b505af11580156107dc573d6000803e3d6000fd5b505050507fb947c78c58eca6e198250d0453e9276761c186d4aa939bca33b28d0af3e0381e86868533866004015460405161081b95949392919061218e565b60405180910390a1505050505050565b61083533826112e4565b6000800160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166323b872dd3330846040518463ffffffff1660e01b8152600401610896939291906121e8565b6020604051808303816000875af11580156108b5573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906108d99190611ec2565b503373ffffffffffffffffffffffffffffffffffffffff167ff882a0847c57aefe6f6c7df2098dd0afd122eb0e886199e223651b8e45fda823826040516109209190611eef565b60405180910390a250565b610935823361134d565b6001600281111561094957610948611f0a565b5b6000600c01600084815260200190815260200160002060010160009054906101000a900460ff16600281111561098257610981611f0a565b5b146109c457816040517f018da6880000000000000000000000000000000000000000000000000000000081526004016109bb9190611f48565b60405180910390fd5b6109ce8233610fd6565b610a0f57336040517f82881f03000000000000000000000000000000000000000000000000000000008152600401610a06919061221f565b60405180910390fd5b610a316000600c016000848152602001908152602001600020600201546113a5565b610a3a82610ea9565b610a7b57816040517f3cb81372000000000000000000000000000000000000000000000000000000008152600401610a729190611f48565b60405180910390fd5b6000610a878333611451565b905060008280519060200120604051602001610aa39190611f48565b60405160208183030381529060405280519060200120905081604001518114610b09578282604001516040517fd6091bc2000000000000000000000000000000000000000000000000000000008152600401610b0092919061227e565b60405180910390fd5b826000601101600086815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206003019080519060200190610b7392919061193b565b50610b7e8433611048565b6001600060070160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600086815260200190815260200160002060006101000a81548160ff021916908315150217905550610c073383600001518460200151610c0291906122ae565b611585565b837f2a1e0100e3bcf67538d8408f2592de3731b8b40f8c6d7dd813e355c7b73848d884604051610c379190612304565b60405180910390a250505050565b6000610c4f6115ee565b90508060050160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054821115610d1a578060050160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054826040517fa4e3bead000000000000000000000000000000000000000000000000000000008152600401610d11929190612326565b60405180910390fd5b818160050160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254610d6b919061234f565b92505081905550505050565b6000610d816115ee565b905080600b0160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054821115610e4c5780600b0160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054826040517f42681092000000000000000000000000000000000000000000000000000000008152600401610e43929190612326565b60405180910390fd5b8181600b0160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254610e9d919061234f565b92505081905550505050565b600080610eb46115ee565b9050600081600c0160008581526020019081526020016000206004018054905011915050919050565b428111610f2157806040517f357efa27000000000000000000000000000000000000000000000000000000008152600401610f189190611eef565b60405180910390fd5b50565b60008085604051602001610f389190612304565b60405160208183030381529060405280519060200120604051602001610f5e91906123fb565b604051602081830303815290604052805190602001209050600060018287878760405160008152602001604052604051610f9b9493929190612430565b6020604051602081039080840390855afa158015610fbd573d6000803e3d6000fd5b5050506020604051035190508092505050949350505050565b600080610fe16115ee565b90506000801b81601101600086815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060020154141591505092915050565b60006110526115ee565b9050600081601101600085815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206040518060a00160405290816000820154815260200160018201548152602001600282015481526020016003820180546110e1906124a4565b80601f016020809104026020016040519081016040528092919081815260200182805461110d906124a4565b801561115a5780601f1061112f5761010080835404028352916020019161115a565b820191906000526020600020905b81548152906001019060200180831161113d57829003601f168201915b5050505050815260200160048201548152505090506000611183826000015183602001516115f3565b905061118f8482611609565b5050505050565b60006111a06115ee565b9050600081601101600085815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206040518060a001604052908160008201548152602001600182015481526020016002820154815260200160038201805461122f906124a4565b80601f016020809104026020016040519081016040528092919081815260200182805461125b906124a4565b80156112a85780601f1061127d576101008083540402835291602001916112a8565b820191906000526020600020905b81548152906001019060200180831161128b57829003601f168201915b50505050508152602001600482015481525050905060006112d1826000015183602001516115f3565b90506112dd8482611621565b5050505050565b60006112ee6115ee565b9050818160050160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825461134191906122ae565b92505081905550505050565b60006113598383611451565b606001515111156113a157806040517f1b933fa0000000000000000000000000000000000000000000000000000000008152600401611398919061221f565b60405180910390fd5b5050565b428111156113ec5780426040517f0674c5900000000000000000000000000000000000000000000000000000000081526004016113e3929190612326565b60405180910390fd5b60006113f782611639565b905042818361140691906122ae565b101561144d578181426040517f4fd4cfc5000000000000000000000000000000000000000000000000000000008152600401611444939291906124d5565b60405180910390fd5b5050565b6114596119c1565b60006114636115ee565b905080601101600085815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206040518060a00160405290816000820154815260200160018201548152602001600282015481526020016003820180546114f0906124a4565b80601f016020809104026020016040519081016040528092919081815260200182805461151c906124a4565b80156115695780601f1061153e57610100808354040283529160200191611569565b820191906000526020600020905b81548152906001019060200180831161154c57829003601f168201915b5050505050815260200160048201548152505091505092915050565b600061158f6115ee565b90508181600b0160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546115e291906122ae565b92505081905550505050565b600090565b6000818361160191906122ae565b905092915050565b6116138282611694565b61161d82826112e4565b5050565b61162b8282610c45565b61163582826117c6565b5050565b60008061070890506000606442851161165d578442611658919061234f565b61166a565b4285611669919061234f565b5b611674919061253b565b90508161ffff1681101561168a578161ffff1690505b8092505050919050565b600061169e6115ee565b90508060060160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054821115611769578060060160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054826040517faf5a111b000000000000000000000000000000000000000000000000000000008152600401611760929190612326565b60405180910390fd5b818160060160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546117ba919061234f565b92505081905550505050565b60006117d06115ee565b9050818160060160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825461182391906122ae565b92505081905550505050565b82805461183b906124a4565b90600052602060002090601f01602090048101928261185d57600085556118a4565b82601f1061187657805160ff19168380011785556118a4565b828001600101855582156118a4579182015b828111156118a3578251825591602001919060010190611888565b5b5090506118b191906119f3565b5090565b8280546118c1906124a4565b90600052602060002090601f0160209004810192826118e3576000855561192a565b82601f106118fc57805160ff191683800117855561192a565b8280016001018555821561192a579182015b8281111561192957825182559160200191906001019061190e565b5b50905061193791906119f3565b5090565b828054611947906124a4565b90600052602060002090601f01602090048101928261196957600085556119b0565b82601f1061198257805160ff19168380011785556119b0565b828001600101855582156119b0579182015b828111156119af578251825591602001919060010190611994565b5b5090506119bd91906119f3565b5090565b6040518060a0016040528060008152602001600081526020016000801916815260200160608152602001600081525090565b5b80821115611a0c5760008160009055506001016119f4565b5090565b6000604051905090565b600080fd5b600080fd5b6000819050919050565b611a3781611a24565b8114611a4257600080fd5b50565b600081359050611a5481611a2e565b92915050565b600060208284031215611a7057611a6f611a1a565b5b6000611a7e84828501611a45565b91505092915050565b6000819050919050565b611a9a81611a87565b8114611aa557600080fd5b50565b600081359050611ab781611a91565b92915050565b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b611b1082611ac7565b810181811067ffffffffffffffff82111715611b2f57611b2e611ad8565b5b80604052505050565b6000611b42611a10565b9050611b4e8282611b07565b919050565b600067ffffffffffffffff821115611b6e57611b6d611ad8565b5b611b7782611ac7565b9050602081019050919050565b82818337600083830152505050565b6000611ba6611ba184611b53565b611b38565b905082815260208101848484011115611bc257611bc1611ac2565b5b611bcd848285611b84565b509392505050565b600082601f830112611bea57611be9611abd565b5b8135611bfa848260208601611b93565b91505092915050565b600080fd5b600060ff82169050919050565b611c1e81611c08565b8114611c2957600080fd5b50565b600081359050611c3b81611c15565b92915050565b600060608284031215611c5757611c56611c03565b5b611c616060611b38565b90506000611c7184828501611c2c565b6000830152506020611c8584828501611aa8565b6020830152506040611c9984828501611aa8565b60408301525092915050565b600080600060a08486031215611cbe57611cbd611a1a565b5b6000611ccc86828701611aa8565b935050602084013567ffffffffffffffff811115611ced57611cec611a1f565b5b611cf986828701611bd5565b9250506040611d0a86828701611c41565b9150509250925092565b600067ffffffffffffffff821115611d2f57611d2e611ad8565b5b611d3882611ac7565b9050602081019050919050565b6000611d58611d5384611d14565b611b38565b905082815260208101848484011115611d7457611d73611ac2565b5b611d7f848285611b84565b509392505050565b600082601f830112611d9c57611d9b611abd565b5b8135611dac848260208601611d45565b91505092915050565b60008060408385031215611dcc57611dcb611a1a565b5b6000611dda85828601611aa8565b925050602083013567ffffffffffffffff811115611dfb57611dfa611a1f565b5b611e0785828601611d87565b9150509250929050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000611e3c82611e11565b9050919050565b611e4c81611e31565b82525050565b611e5b81611a24565b82525050565b6000604082019050611e766000830185611e43565b611e836020830184611e52565b9392505050565b60008115159050919050565b611e9f81611e8a565b8114611eaa57600080fd5b50565b600081519050611ebc81611e96565b92915050565b600060208284031215611ed857611ed7611a1a565b5b6000611ee684828501611ead565b91505092915050565b6000602082019050611f046000830184611e52565b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602160045260246000fd5b611f4281611a87565b82525050565b6000602082019050611f5d6000830184611f39565b92915050565b6000604082019050611f786000830185611f39565b611f856020830184611e43565b9392505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000611ff582611a24565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff820361202757612026611fbb565b5b600182019050919050565b6000819050919050565b6000819050919050565b600061206161205c61205784612032565b61203c565b611a24565b9050919050565b61207181612046565b82525050565b600082825260208201905092915050565b50565b6000612098600083612077565b91506120a382612088565b600082019050919050565b600060a0820190506120c36000830187611e43565b6120d06020830186611e43565b6120dd6040830185611e52565b6120ea6060830184612068565b81810360808301526120fb8161208b565b905095945050505050565b600081519050919050565b600082825260208201905092915050565b60005b83811015612140578082015181840152602081019050612125565b8381111561214f576000848401525b50505050565b600061216082612106565b61216a8185612111565b935061217a818560208601612122565b61218381611ac7565b840191505092915050565b600060a0820190506121a36000830188611f39565b81810360208301526121b58187612155565b90506121c46040830186611e43565b6121d16060830185611e43565b6121de6080830184611e52565b9695505050505050565b60006060820190506121fd6000830186611e43565b61220a6020830185611e43565b6122176040830184611e52565b949350505050565b60006020820190506122346000830184611e43565b92915050565b600081519050919050565b60006122508261223a565b61225a8185612077565b935061226a818560208601612122565b61227381611ac7565b840191505092915050565b600060408201905081810360008301526122988185612245565b90506122a76020830184611f39565b9392505050565b60006122b982611a24565b91506122c483611a24565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff038211156122f9576122f8611fbb565b5b828201905092915050565b6000602082019050818103600083015261231e8184612245565b905092915050565b600060408201905061233b6000830185611e52565b6123486020830184611e52565b9392505050565b600061235a82611a24565b915061236583611a24565b92508282101561237857612377611fbb565b5b828203905092915050565b600081905092915050565b7f19457468657265756d205369676e6564204d6573736167653a0a333200000000600082015250565b60006123c4601c83612383565b91506123cf8261238e565b601c82019050919050565b6000819050919050565b6123f56123f082611a87565b6123da565b82525050565b6000612406826123b7565b915061241282846123e4565b60208201915081905092915050565b61242a81611c08565b82525050565b60006080820190506124456000830187611f39565b6124526020830186612421565b61245f6040830185611f39565b61246c6060830184611f39565b95945050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806124bc57607f821691505b6020821081036124cf576124ce612475565b5b50919050565b60006060820190506124ea6000830186611e52565b6124f76020830185611e52565b6125046040830184611e52565b949350505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601260045260246000fd5b600061254682611a24565b915061255183611a24565b9250826125615761256061250c565b5b82820490509291505056fea26469706673582212204c000a41c81ef24f5fb2f4c011e97d822be19f1fea0d864e87f8d0ba13425c0c64736f6c634300080d0033";

export class ArchaeologistFacet__factory extends ContractFactory {
  constructor(
    ...args: [signer: Signer] | ConstructorParameters<typeof ContractFactory>
  ) {
    if (args.length === 1) {
      super(_abi, _bytecode, args[0]);
    } else {
      super(...args);
    }
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ArchaeologistFacet> {
    return super.deploy(overrides || {}) as Promise<ArchaeologistFacet>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): ArchaeologistFacet {
    return super.attach(address) as ArchaeologistFacet;
  }
  connect(signer: Signer): ArchaeologistFacet__factory {
    return super.connect(signer) as ArchaeologistFacet__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ArchaeologistFacetInterface {
    return new utils.Interface(_abi) as ArchaeologistFacetInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ArchaeologistFacet {
    return new Contract(address, _abi, signerOrProvider) as ArchaeologistFacet;
  }
}