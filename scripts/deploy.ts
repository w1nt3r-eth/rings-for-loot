import {BigNumber} from '@ethersproject/bignumber';
import {formatUnits, parseUnits} from '@ethersproject/units';
import {ethers, run} from 'hardhat';
import addresses, {getAddress} from '../src/addresses';

async function main() {
  const [owner] = await ethers.getSigners();
  console.log('Owner:', owner.address);

  const {chainId} = await ethers.provider.getNetwork();
  console.log('On chain ID', chainId);

  const args = [
    [getAddress(addresses.loot, chainId), getAddress(addresses.mloot, chainId), getAddress(addresses.genesis, chainId)],
  ];
  console.log('Args:', args);

  const gasPrice = await waitForGasPriceBelow(parseUnits('80', 'gwei'));

  const RingsForLoot = await ethers.getContractFactory('RingsForLoot');
  const rings = await RingsForLoot.deploy(args[0], {gasPrice});
  console.log('RingsForLoot address:', rings.address);

  await rings.deployed();
  console.log('Deployed!');

  await rings.transferOwnership('0x1E79b045Dc29eAe9fdc69673c9DCd7C53E5E159D'); // w1nt3r.eth
  console.log('Transferred ownership');

  // Wait until Etherscan gets the transaction
  await new Promise((resolve) => setTimeout(resolve, 60_000));

  await run('verify:verify', {
    address: rings.address,
    constructorArguments: args,
  });
}

async function waitForGasPriceBelow(max: BigNumber): Promise<BigNumber> {
  console.log('Waiting for gas price below', formatUnits(max, 'gwei'), 'gwei');
  while (true) {
    const price = await ethers.provider.getGasPrice();
    console.log(new Date().toLocaleString(), 'Gas Price:', formatUnits(price, 'gwei'), 'gwei');
    if (price.lte(max)) {
      console.log('Good enough!');
      return price;
    }
    await new Promise((resolve) => setTimeout(resolve, 30_000));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
