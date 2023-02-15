import bip39 from "bip39";

function mnemonicGen() {
  const mnemonic = bip39.generateMnemonic();
  console.log(mnemonic);
}

mnemonicGen();
