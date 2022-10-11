import { BigNumber, ethers } from "ethers";

export function logCallout(logOutput: Function) {
  console.log(
    "\n\n=========================================================================================================\n"
  );

  logOutput();

  console.log(
    "\n=========================================================================================================\n\n"
  );
}

export function logBalance(prefix: string, balance: BigNumber, ticker: string) {
  console.log(` * ${prefix}:             ${ethers.utils.formatEther(balance)} ${ticker}`);
}