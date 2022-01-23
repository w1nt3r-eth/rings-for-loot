import {ethers} from 'hardhat';
import '@nomiclabs/hardhat-waffle';
import {expect, use} from 'chai';
import {BigNumber} from '@ethersproject/bignumber';
import {formatEther, parseUnits, formatUnits, parseEther} from '@ethersproject/units';
import {Wallet} from '@ethersproject/wallet';
import {decodeRing, encodeRing, ringFromBag, ringToString, SaleState} from '../src/loot';
import {RingsForLoot} from '../typechain';
import {writeFileSync} from 'fs';
import path from 'path';
import {BAG_ID_TO_RING_ID, RING_ID_TO_MAX_SUPPLY, RING_ID_TO_RING_NAME, RING_NAME_TO_RING_ID} from '../src/data';
import ProgressBar from 'progress';
import {
  PRICE_FORGE_EPIC,
  PRICE_FORGE_LEGENDARY,
  PRICE_FORGE_MYTHIC,
  PRICE_RING_COMMON,
  PRICE_RING_EPIC,
  PRICE_RING_LEGENDARY,
  PRICE_RING_MYTHIC,
} from '../src/prices';
import signWhitelist from '../src/signWhitelist';

use(require('chai-as-promised'));
use(require('chai-subset'));

const GAS_PRICE = parseUnits('100', 'gwei');

const SIGNER = Wallet.fromMnemonic('choose bone matter romance glance fault thrive soccer urban barrel shoulder lift');

async function reportGas(label: string, gasP: Promise<BigNumber>) {
  const gas = await gasP;
  console.log(
    label,
    gas
      .toLocaleString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      .padStart(10, ' ') +
      ' (~' +
      formatEther(gas.mul(GAS_PRICE)) +
      'Ξ @ ' +
      formatUnits(GAS_PRICE, 'gwei') +
      ' gwei)',
  );
}

it('uses Loot', async () => {
  const Loot = await ethers.getContractFactory('Loot');
  const loot = await Loot.deploy();
  await loot.deployed();

  await loot.claim(1);
  const ring = await loot.getRing(1);
  expect(ring).to.eql('Gold Ring');
});

it('purchase common', async () => {
  const Loot = await ethers.getContractFactory('Loot');
  const loot = await Loot.deploy();
  await loot.deployed();

  const [owner] = await ethers.getSigners();
  const Rings = await ethers.getContractFactory('RingsForLoot');
  const rings = await Rings.deploy([loot.address]);
  await rings.deployed();
  await rings.setState(SaleState.Active);

  await rings.purchaseCommon(1, [], {value: PRICE_RING_COMMON});
  const ringId = await lastMintedRingId(rings);

  await expect(rings.balanceOf(owner.address, ringId)).to.eventually.eql(BigNumber.from(1));

  await expect(rings.purchaseCommon(0, [])).to.be.rejectedWith('at least one');
  await expect(rings.purchaseCommon(1, [], {value: PRICE_RING_EPIC})).to.be.rejectedWith('Wrong price');
  await expect(rings.purchaseCommon(30, [], {value: PRICE_RING_COMMON.mul(30)})).to.be.rejectedWith('Too many at once');
});

it('purchase matching', async () => {
  const [owner, user1] = await ethers.getSigners();

  const Loot = await ethers.getContractFactory('Loot');
  const loot = await Loot.deploy();
  await loot.deployed();

  const MoreLoot = await ethers.getContractFactory('TemporalLoot');
  const mloot = await MoreLoot.deploy();
  await loot.deployed();

  const Genesis = await ethers.getContractFactory('Genesis');
  const genesis = await Genesis.deploy();
  await genesis.deployed();

  const goldRingOfPower = RING_NAME_TO_RING_ID['Gold Ring of Power'];
  const silverRingOfAnger = RING_NAME_TO_RING_ID['Silver Ring of Anger'];

  await loot.claim(7443); // Silver Ring of Anger
  await mloot.claim(7443); // Silver Ring of Anger
  await loot.claim(6726); // Silver Ring of Anger
  await loot.connect(user1).claim(1111);

  const Rings = await ethers.getContractFactory('RingsForLoot');
  const rings = await Rings.deploy([loot.address, mloot.address, genesis.address]);
  await rings.deployed();
  await rings.setState(SaleState.Active);

  await rings.purchaseMatching(loot.address, 7443, silverRingOfAnger, [], {value: PRICE_RING_EPIC});
  await expect(rings.balanceOf(owner.address, silverRingOfAnger)).to.eventually.eql(BigNumber.from(1));
  await expect(rings.bagClaimed(loot.address, 7443)).to.eventually.eql(true);
  await expect(rings.bagClaimed(loot.address, 6726)).to.eventually.eql(false);

  await rings.purchaseMatching(mloot.address, 7443, silverRingOfAnger, [], {value: PRICE_RING_EPIC});
  await expect(rings.bagClaimed(mloot.address, 7443)).to.eventually.eql(true);

  await expect(
    rings.purchaseMatching(loot.address, 9999, silverRingOfAnger, [], {value: PRICE_RING_EPIC}),
  ).to.be.rejectedWith('nonexistent token');
  await expect(
    rings.purchaseMatching(loot.address, 1111, silverRingOfAnger, [], {value: PRICE_RING_EPIC}),
  ).to.be.rejectedWith('Not owner');
  await expect(
    rings.purchaseMatching(loot.address, 7443, goldRingOfPower, [], {value: PRICE_RING_EPIC}),
  ).to.be.rejectedWith('Wrong ring');
  await expect(
    rings.purchaseMatching(loot.address, 7443, silverRingOfAnger, [], {value: PRICE_RING_EPIC}),
  ).to.be.rejectedWith('Already claimed');

  const loot2 = await Loot.deploy();
  await loot2.deployed();
  await expect(
    rings.purchaseMatching(loot2.address, 9999, silverRingOfAnger, [], {value: PRICE_RING_EPIC}),
  ).to.be.rejectedWith('Not compatible');

  const mythicRing = RING_NAME_TO_RING_ID['"Behemoth Tear" Titanium Ring of Vitriol'];
  await loot.claim(mythicRing);
  await mloot.claim(mythicRing);
  await rings.purchaseMatching(loot.address, mythicRing, mythicRing, [], {value: PRICE_RING_MYTHIC});
  await expect(
    rings.purchaseMatching(mloot.address, mythicRing, mythicRing, [], {value: PRICE_RING_MYTHIC}),
  ).to.be.rejectedWith('Not in stock');

  await genesis.mintRing('Titanium Ring of Perfection');
  await genesis.mintRing('Crystal Ring of Awesomeness');
  await rings.purchaseMatching(genesis.address, 1, RING_NAME_TO_RING_ID['Titanium Ring of Perfection'], [], {
    value: PRICE_RING_EPIC,
  });
  await expect(
    rings.purchaseMatching(genesis.address, 2, RING_NAME_TO_RING_ID['Titanium Ring of Perfection'], [], {
      value: PRICE_RING_EPIC,
    }),
  ).to.be.rejectedWith('Wrong ring');
});

it('forge', async () => {
  const Loot = await ethers.getContractFactory('Loot');
  const loot = await Loot.deploy();
  await loot.deployed();

  const [owner] = await ethers.getSigners();
  const Rings = await ethers.getContractFactory('RingsForLoot');
  const rings = await Rings.deploy([loot.address]);
  await rings.deployed();
  await rings.setState(SaleState.Active);

  await rings.purchaseCommon(25, [], {value: PRICE_RING_COMMON.mul(25)});
  await rings.purchaseCommon(25, [], {value: PRICE_RING_COMMON.mul(25)});
  await rings.purchaseCommon(25, [], {value: PRICE_RING_COMMON.mul(25)});
  await rings.purchaseCommon(25, [], {value: PRICE_RING_COMMON.mul(25)});

  const [goldBalanceBefore, bronzeBalanceBefore] = await rings.balanceOfBatch([owner.address, owner.address], [1, 11]);

  await rings.forge(0, 2, {value: PRICE_FORGE_EPIC});
  await lastMintedRingId(rings);
  expect(RING_ID_TO_RING_NAME[await lastMintedRingId(rings)]).to.include('Gold Ring of');
  await rings.forge(0, 3, {value: PRICE_FORGE_LEGENDARY});
  await rings.forge(2, 4, {value: PRICE_FORGE_MYTHIC});
  expect(RING_ID_TO_RING_NAME[await lastMintedRingId(rings)]).to.include('Bronze Ring of');

  const [goldBalanceAfter, bronzeBalanceAfter] = await rings.balanceOfBatch([owner.address, owner.address], [1, 11]);
  expect(goldBalanceBefore.sub(goldBalanceAfter).toNumber()).to.eq(5, 'gold');
  expect(bronzeBalanceBefore.sub(bronzeBalanceAfter).toNumber()).to.eq(4, 'bronze');

  await expect(rings.forge(1, 3, {value: PRICE_FORGE_EPIC})).to.be.rejectedWith('Wrong price');
});

it('withdraw all', async () => {
  const Loot = await ethers.getContractFactory('Loot');
  const loot = await Loot.deploy();
  await loot.deployed();

  const [owner, user1] = await ethers.getSigners();
  const Rings = await ethers.getContractFactory('RingsForLoot');
  const rings = await Rings.deploy([loot.address]);
  await rings.deployed();
  await rings.setState(SaleState.Active);

  await rings.connect(user1).purchaseCommon(2, [], {value: PRICE_RING_COMMON.mul(2)});
  await expect(rings.connect(user1).withdrawAll()).to.be.rejectedWith('caller is not the owner');

  const balanceBefore = await owner.getBalance();
  const tx = await rings.withdrawAll();
  const receipt = await tx.wait();
  const gasExpense = receipt.gasUsed.mul(receipt.effectiveGasPrice);
  const balanceAfter = await owner.getBalance();

  expect(balanceAfter.add(gasExpense).sub(balanceBefore)).to.eql(PRICE_RING_COMMON.mul(2));
});

it('supports EIPs', async () => {
  const Loot = await ethers.getContractFactory('Loot');
  const loot = await Loot.deploy();
  await loot.deployed();

  const [owner, user1] = await ethers.getSigners();
  const Rings = await ethers.getContractFactory('RingsForLoot');
  const rings = await Rings.deploy([loot.address]);
  await rings.deployed();
  await rings.setState(SaleState.Active);

  expect(await rings.supportsInterface('0x01ffc9a7')).to.eql(true); // ERC165
  expect(await rings.supportsInterface('0x2a55205a')).to.eql(true); // ERC2981
  expect(await rings.supportsInterface('0x12345678')).to.eql(false);

  expect(await rings.connect(user1).royaltyInfo(BigNumber.from(0), parseEther('1'))).to.eql([
    owner.address,
    parseEther('0.05'),
  ]);
});

it('sale states', async () => {
  const [owner, user1] = await ethers.getSigners();

  const Loot = await ethers.getContractFactory('Loot');
  const loot = await Loot.deploy();
  await loot.deployed();
  await loot.claim(1);
  await loot.ownerClaim(7977);

  const Rings = await ethers.getContractFactory('RingsForLoot');
  const rings = await Rings.deploy([loot.address]);
  await rings.deployed();

  const value = PRICE_RING_COMMON;

  await expect(rings.purchaseCommon(1, [], {value})).to.be.rejectedWith('Sale not active');
  await expect(rings.purchaseMatching(loot.address, 1, 1, [], {value})).to.be.rejectedWith('Sale not active');

  await rings.setState(SaleState.OnlyCommon);
  await rings.purchaseCommon(1, [], {value});
  await rings.purchaseMatching(loot.address, 1, 1, [], {value});
  await expect(rings.purchaseMatching(loot.address, 7977, 7977, [], {value: PRICE_RING_MYTHIC})).to.be.rejectedWith(
    'Sale not active',
  );

  await rings.setState(SaleState.Active);
  await rings.purchaseCommon(1, [], {value});
  await rings.purchaseMatching(loot.address, 7977, 7977, [], {value: PRICE_RING_MYTHIC});
});

it('checks purchaseCommon signature', async () => {
  const [owner, user1] = await ethers.getSigners();

  const Loot = await ethers.getContractFactory('Loot');
  const loot = await Loot.deploy();
  await loot.deployed();

  const Rings = await ethers.getContractFactory('RingsForLoot');
  const rings = await Rings.deploy([loot.address]);
  await rings.deployed();
  await rings.setState(SaleState.Active);

  const {chainId} = await ethers.provider.getNetwork();
  const signature = await signWhitelist(chainId, rings.address, SIGNER, owner.address);

  await expect(rings.purchaseCommon(1, signature)).to.be.rejectedWith('Whitelist not enabled');
  await rings.setWhitelistSigningAddress(SIGNER.address);

  await expect(rings.purchaseCommon(1, signature, {value: PRICE_RING_COMMON})).to.be.rejectedWith('Wrong price');
  await expect(rings.purchaseCommon(2, signature)).to.be.rejectedWith('Can only get one');
  await expect(rings.connect(user1).purchaseCommon(1, signature)).to.be.rejectedWith('Invalid Signature');

  await rings.purchaseCommon(1, signature);
  const ringId = await lastMintedRingId(rings);
  await expect(rings.balanceOf(owner.address, ringId)).to.eventually.eql(BigNumber.from(1));

  await expect(rings.purchaseCommon(1, signature)).to.be.rejectedWith('Already used');
  await expect(rings.whitelistUsed(user1.address)).to.eventually.eq(false);
  await expect(rings.whitelistUsed(owner.address)).to.eventually.eq(true);
});

it('checks purchaseMatching signature', async () => {
  const [owner, user1] = await ethers.getSigners();

  const Loot = await ethers.getContractFactory('Loot');
  const loot = await Loot.deploy();
  await loot.deployed();

  // All gold rings
  await loot.claim(1);
  await loot.claim(4);
  await loot.connect(user1).claim(15);

  const Rings = await ethers.getContractFactory('RingsForLoot');
  const rings = await Rings.deploy([loot.address]);
  await rings.deployed();
  await rings.setState(SaleState.Active);

  const {chainId} = await ethers.provider.getNetwork();
  const signature = await signWhitelist(chainId, rings.address, SIGNER, owner.address);

  await expect(rings.purchaseMatching(loot.address, 1, 1, signature)).to.be.rejectedWith('Whitelist not enabled');
  await rings.setWhitelistSigningAddress(SIGNER.address);

  await expect(rings.purchaseMatching(loot.address, 1, 1, signature, {value: PRICE_RING_COMMON})).to.be.rejectedWith(
    'Wrong price',
  );
  await expect(rings.connect(user1).purchaseMatching(loot.address, 15, 1, signature)).to.be.rejectedWith(
    'Invalid Signature',
  );

  await rings.purchaseMatching(loot.address, 1, 1, signature);
  const ringId = await lastMintedRingId(rings);
  await expect(rings.balanceOf(owner.address, ringId)).to.eventually.eql(BigNumber.from(1));

  await expect(rings.purchaseMatching(loot.address, 4, 1, signature)).to.be.rejectedWith('Already used');

  const signature2 = await signWhitelist(chainId, rings.address, SIGNER, owner.address);
  await expect(rings.purchaseCommon(1, signature2)).to.be.rejectedWith('Already used');
  await expect(rings.whitelistUsed(user1.address)).to.eventually.eq(false);
  await expect(rings.whitelistUsed(owner.address)).to.eventually.eq(true);
});

it('uri', async () => {
  const Loot = await ethers.getContractFactory('Loot');
  const loot = await Loot.deploy();
  await loot.deployed();

  const [owner, user1] = await ethers.getSigners();
  const Rings = await ethers.getContractFactory('RingsForLoot');
  const rings = await Rings.deploy([loot.address]);
  await rings.deployed();
  await rings.setState(SaleState.Active);

  await loot.claim(1);
  await loot.ownerClaim(7964);
  await rings.purchaseMatching(loot.address, 1, 1, [], {value: PRICE_RING_COMMON});
  await rings.purchaseMatching(loot.address, 7964, 7964, [], {value: PRICE_RING_MYTHIC});

  await expect(tokenMetadata(rings, 1)).to.eventually.eql({
    name: 'Gold Ring',
    description:
      'Rings (for Loot) is the first and largest 3D interpretation of an entire category in Loot. Adventurers, builders, and artists are encouraged to reference Rings (for Loot) to further expand on the imagination of Loot.',
    image: 'ipfs:///1.jpg',
  });
  await expect(tokenMetadata(rings, 7964)).to.eventually.eql({
    name: '"Rage Bite" Gold Ring of Titans +1',
    description:
      'Rings (for Loot) is the first and largest 3D interpretation of an entire category in Loot. Adventurers, builders, and artists are encouraged to reference Rings (for Loot) to further expand on the imagination of Loot.',
    image: 'ipfs:///7964.jpg',
  });

  await rings.setIpfs('QabTrm');
  await expect(tokenMetadata(rings, 1)).to.eventually.eql({
    name: 'Gold Ring',
    description:
      'Rings (for Loot) is the first and largest 3D interpretation of an entire category in Loot. Adventurers, builders, and artists are encouraged to reference Rings (for Loot) to further expand on the imagination of Loot.',
    image: 'ipfs://QabTrm/1.jpg',
  });

  await expect(rings.connect(user1).setIpfs('evil')).to.be.rejectedWith('caller is not the owner');
  await expect(rings.uri(2)).to.be.rejectedWith('Ring does not exist');
});

describe.skip('slow', () => {
  it('purchase all common', async () => {
    const Loot = await ethers.getContractFactory('Loot');
    const loot = await Loot.deploy();
    await loot.deployed();

    const [owner] = await ethers.getSigners();
    const Rings = await ethers.getContractFactory('RingsForLoot');
    const rings = await Rings.deploy([loot.address]);
    await rings.deployed();
    await rings.setState(SaleState.Active);

    const bar = new ProgressBar('Purchasing common :current/:total :bar :eta', {total: 238});
    for (let i = 0; i < 238; i++) {
      bar.tick();
      await rings.purchaseCommon(24, [], {value: PRICE_RING_COMMON.mul(24)});
    }
    bar.terminate();

    await expect(rings.balanceOf(owner.address, 1)).to.eventually.eql(BigNumber.from(1093));
    await expect(rings.balanceOf(owner.address, 6)).to.eventually.eql(BigNumber.from(1178));
    await expect(rings.balanceOf(owner.address, 11)).to.eventually.eql(BigNumber.from(1166));
    await expect(rings.balanceOf(owner.address, 7)).to.eventually.eql(BigNumber.from(1163));
    await expect(rings.balanceOf(owner.address, 2)).to.eventually.eql(BigNumber.from(1112));

    await expect(rings.purchaseCommon(1, [], {value: PRICE_RING_COMMON})).to.be.rejectedWith('Not enough');
  });

  it('purchase all matching', async () => {
    const Loot = await ethers.getContractFactory('Loot');
    const loot = await Loot.deploy();
    await loot.deployed();

    const loot2 = await Loot.deploy();
    await loot2.deployed();

    const Rings = await ethers.getContractFactory('RingsForLoot');
    const rings = await Rings.deploy([loot.address, loot2.address]);
    await rings.deployed();
    await rings.setState(SaleState.Active);

    const bar = new ProgressBar('Purchasing matching :current/:total :bar :eta', {total: 8000});
    for (let i = 1; i <= 8000; i++) {
      bar.tick();
      const ringId = BAG_ID_TO_RING_ID[i];
      if (i < 7778) {
        await loot.claim(i);
      } else {
        await loot.ownerClaim(i);
      }
      const maxSupply = RING_ID_TO_MAX_SUPPLY[ringId];
      const value =
        maxSupply === 1
          ? PRICE_RING_MYTHIC
          : maxSupply === 2
          ? PRICE_RING_LEGENDARY
          : maxSupply < 1000
          ? PRICE_RING_EPIC
          : PRICE_RING_COMMON;
      await rings.purchaseMatching(loot.address, i, ringId, [], {value});
      const metadata = await tokenMetadata(rings, ringId);
      expect(metadata.name).to.eql(RING_ID_TO_RING_NAME[ringId]);
      expect(metadata.image).to.match(new RegExp(`/${ringId}.jpg`));
    }

    const bar2 = new ProgressBar("Validating can't purchase :current/:total :bar :eta", {total: 8000});
    for (let i = 1; i <= 8000; i++) {
      bar2.tick();
      const ringId = BAG_ID_TO_RING_ID[i];
      if (i < 7778) {
        await loot2.claim(i);
      } else {
        await loot2.ownerClaim(i);
      }
      const maxSupply = RING_ID_TO_MAX_SUPPLY[ringId];
      const value =
        maxSupply === 1
          ? PRICE_RING_MYTHIC
          : maxSupply === 2
          ? PRICE_RING_LEGENDARY
          : maxSupply < 1000
          ? PRICE_RING_EPIC
          : PRICE_RING_COMMON;
      await expect(rings.purchaseMatching(loot2.address, i, ringId, [], {value})).to.be.rejectedWith('Not in stock');
    }
  }).timeout(600_000);

  describe('forge all', async () => {
    const inventory = {};
    let rings: RingsForLoot;

    before(() => {
      const nameToId = {};
      for (let i = 1; i <= 8000; i++) {
        const name = ringToString(ringFromBag(i));
        const id = nameToId[name] || i;
        nameToId[name] = id;

        inventory[id] = (inventory[id] || 0) + 1;
      }
    });

    beforeEach(async () => {
      const Loot = await ethers.getContractFactory('Loot');
      const loot = await Loot.deploy();
      await loot.deployed();

      const Rings = await ethers.getContractFactory('RingsForLoot');
      rings = await Rings.deploy([loot.address]);
      await rings.deployed();
      await rings.setState(SaleState.Active);

      for (let i = 0; i < 238; i++) {
        await rings.purchaseCommon(24, [], {value: PRICE_RING_COMMON.mul(24)});
      }
    });

    async function forgeAll(expected, amount: number, value: BigNumber) {
      const total = Object.values<number>(expected).reduce((acc, v) => acc + v, 0);
      const minted = {};

      const bar = new ProgressBar('Forging :current/:total :bar :eta', {total});
      for (let i = 0; i < total; i++) {
        bar.tick();
        await rings.forge(0, amount, {value});
        const ringId = await lastMintedRingId(rings);
        minted[ringId] = (minted[ringId] || 0) + 1;
      }

      expect(minted).to.eql(expected);
      await expect(rings.forge(0, amount, {value})).to.be.rejectedWith('data is empty');
    }

    it('epic', async () => {
      const epic = Object.fromEntries(
        Object.entries<number>(inventory).filter(
          ([id, amount]) => amount > 2 && amount < 1000 && ringFromBag(Number(id)).material == 1,
        ),
      );
      await forgeAll(epic, 2, PRICE_FORGE_EPIC);
    }).timeout(600_000);

    it('legendary', async () => {
      const legendary = Object.fromEntries(
        Object.entries<number>(inventory).filter(
          ([id, amount]) => amount == 2 && ringFromBag(Number(id)).material == 1,
        ),
      );
      await forgeAll(legendary, 3, PRICE_FORGE_LEGENDARY);
    }).timeout(600_000);

    it('mythic', async () => {
      const mythic = Object.fromEntries(
        Object.entries<number>(inventory).filter(
          ([id, amount]) => amount == 1 && ringFromBag(Number(id)).material == 1,
        ),
      );
      await forgeAll(mythic, 4, PRICE_FORGE_MYTHIC);
    }).timeout(600_000);
  });

  it('matches Loot names', async () => {
    const Loot = await ethers.getContractFactory('Loot');
    const loot = await Loot.deploy();
    await loot.deployed();

    for (let i = 1; i <= 8000; i++) {
      const ringSol = await loot.getRing(i);
      const ringJS = ringToString(ringFromBag(i));
      expect(ringJS).to.eql(ringSol, `bagId = ${i}`);
    }
  }).timeout(60_000);
});

describe.skip('codegen', () => {
  it('encodes / decodes rings', () => {
    let max = 0;
    for (let i = 1; i <= 8000; i++) {
      const ring = ringFromBag(i);
      max = Math.max(max, encodeRing(ring));
      expect(decodeRing(encodeRing(ring))).to.eql(ring, ringToString(ring));
    }
  });

  it('inventory', () => {
    const data = {};
    const inventory = {};
    const nameToId = {};
    for (let i = 1; i <= 8000; i++) {
      const name = ringToString(ringFromBag(i));
      const id = nameToId[name] || i;
      nameToId[name] = id;

      inventory[id] = (inventory[id] || 0) + 1;
      data[name] = data[name] || [];
      data[name].push(i);
    }

    const commonIds = {};
    const commonMax = {};
    const epicIds = {};
    const epicMax = {};
    const legendary = {};
    const mythic = {};
    for (const [id, amount] of Object.entries<number>(inventory)) {
      const ring = ringFromBag(Number(id));
      const key = ring.material - 1;
      const kind = amount > 1000 ? commonIds : amount > 2 ? epicIds : amount > 1 ? legendary : mythic;
      kind[key] = kind[key] || '';
      kind[key] += kind === commonIds ? id : Number(id).toString(16).padStart(4, '0');

      if (kind === commonIds) {
        commonMax[key] = amount;
      }
      // For epic, encode quantity as 1 byte
      if (kind === epicIds) {
        epicMax[key] = epicMax[key] || '';
        epicMax[key] += Number(amount).toString(16).padStart(2, '0');
      }

      // For legendary, encode quantity as duplicated ids
      if (kind === legendary) {
        kind[key] += Number(id).toString(16).padStart(4, '0');
      }
    }

    console.log('RingsForLoot.sol:');
    console.log('commonIds = [' + Object.values(commonIds).join(', ') + ']');
    console.log('commonMax = [' + Object.values(commonMax).join(', ') + ']');

    for (const [key, map] of Object.entries({epicIds, epicMax, legendary, mythic})) {
      Object.values(map).forEach((value, index) => {
        console.log(`${key}[${index}] = hex'${value}';`);
      });
    }

    writeFileSync(path.join(__dirname, '../src/gen.ts'), 'export const ALL_RINGS_DATA = ' + JSON.stringify(data));
  });
});

async function lastMintedRingId(rings: RingsForLoot): Promise<number> {
  const log = await rings.queryFilter(rings.filters.TransferSingle());
  return log[log.length - 1].args.id.toNumber();
}

async function tokenMetadata(
  rings: RingsForLoot,
  tokenId: number,
): Promise<{name: string; description: string; image: string}> {
  const uri = await rings.uri(tokenId);
  expect(uri).to.match(/^data:application\/json;base64,/);
  const base64 = uri.split(',')[1];
  const json = Buffer.from(base64, 'base64').toString();
  try {
    return JSON.parse(json);
  } catch (error) {
    throw new Error((error as any).message + ' ' + json);
  }
}
