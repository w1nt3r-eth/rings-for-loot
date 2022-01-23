import {ILoot, ILoot__factory, RingsForLoot} from '../typechain';
import addresses from './addresses';

async function fetchRings(name: string, owner: string, reader: ILoot, rings: RingsForLoot) {
  const balance = await reader.balanceOf(owner);
  const bagIds = await Promise.all(
    new Array(balance.toNumber()).fill(0).map((_, i) => reader.tokenOfOwnerByIndex(owner, i)),
  );
  const [ringNames, bagClaimed] = await Promise.all([
    Promise.all(bagIds.map((id) => reader.getRing(id))),
    Promise.all(bagIds.map((id) => rings.bagClaimed(reader.address, id))),
  ]);
  return bagIds.map((bagId, index) => ({
    name,
    address: reader.address,
    bagId: bagId.toNumber(),
    ringName: ringNames[index],
    claimed: bagClaimed[index],
  }));
}

export async function fetchBags(owner: string, chainId: number, rings: RingsForLoot) {
  const bags = await Promise.all(
    (
      [
        ['Loot Bag', addresses.loot],
        ['mLoot Bag', addresses.mloot],
        ['Genesis Adventurer', addresses.genesis],
      ] as const
    )
      .filter(([name, addresses]) => chainId in addresses)
      .map(([name, addresses]) =>
        fetchRings(name, owner, ILoot__factory.connect(addresses[chainId], rings.provider), rings),
      ),
  );

  return bags.flat();
}
