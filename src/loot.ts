import {BigNumber} from '@ethersproject/bignumber';
import keccak256 from 'keccak256';
import memoizee from 'memoizee';
import {RING_ID_TO_MAX_SUPPLY} from './data';

export type RingSpec = {
  material: number;
  suffix: number;
  namePrefix: number;
  nameSuffix: number;
  aug: number;
};

export enum ItemLevel {
  Common = 'common',
  Epic = 'epic',
  Legendary = 'legendary',
  Mythic = 'mythic',
}

export enum SaleState {
  Paused = 0,
  OnlyCommon = 1,
  Active = 2,
}

export const ringFromBag = memoizee((bagId: number) => {
  const rand = BigNumber.from(keccak256('RING' + bagId));

  let material = rand.mod(rings.length).toNumber() + 1;
  let suffix = 0;
  let namePrefix = 0;
  let nameSuffix = 0;
  let aug = 0;
  let greatness = rand.mod(21).toNumber();
  if (greatness > 14) {
    suffix = rand.mod(suffixes.length).toNumber() + 1;
  }
  if (greatness >= 19) {
    namePrefix = rand.mod(namePrefixes.length).toNumber() + 1;
    nameSuffix = rand.mod(nameSuffixes.length).toNumber() + 1;
    if (greatness == 19) {
      // ...
    } else {
      aug = 1;
    }
  }

  return {material, suffix, namePrefix, nameSuffix, aug};
});

export function ringLevelFromSupply(maxSupply: number) {
  if (maxSupply > 1000) {
    return ItemLevel.Common;
  }
  if (maxSupply > 2) {
    return ItemLevel.Epic;
  }
  if (maxSupply === 2) {
    return ItemLevel.Legendary;
  }
  if (maxSupply === 1) {
    return ItemLevel.Mythic;
  }
}

export function ringMaxSupply(ringId: number): number {
  return RING_ID_TO_MAX_SUPPLY[ringId] || 0;
}

export function superpack(multiples: number[], data: number[]) {
  let value = 0;
  for (let i = multiples.length - 1; i >= 0; i--) {
    value *= multiples[i];
    value += data[i];
  }
  return value;
}

export function superunpack(value: number, multiples: number[]) {
  const data: number[] = [];
  for (let i = 0; i < multiples.length; i++) {
    data[i] = value % multiples[i];
    value = Math.floor(value / multiples[i]);
  }
  return data;
}

const MX = () => [rings.length + 1, suffixes.length + 1, namePrefixes.length + 1, nameSuffixes.length + 1, 2];

export function encodeRing({material, suffix = 0, namePrefix = 0, nameSuffix = 0, aug = 0}): number {
  if (!isValidRing({material, suffix, namePrefix, nameSuffix, aug})) {
    throw new Error('Invalid ring ' + JSON.stringify({material, suffix, namePrefix, nameSuffix, aug}));
  }
  return superpack(MX(), [material, suffix, namePrefix, nameSuffix, aug]);
}

export function decodeRing(value: number) {
  const [material, suffix, namePrefix, nameSuffix, aug] = superunpack(value, MX());
  return {material, suffix, namePrefix, nameSuffix, aug};
}

export function isValidRing({material, suffix, namePrefix, nameSuffix, aug}) {
  if (!isInRangeOfOptions(material, rings)) {
    return false;
  }
  if (suffix == 0) {
    return namePrefix === 0 && nameSuffix === 0 && aug === 0;
  }
  if (!isInRangeOfOptions(suffix, suffixes)) {
    return false;
  }
  if (namePrefix === 0 && nameSuffix === 0 && aug === 0) {
    return true;
  }

  return (
    isInRangeOfOptions(namePrefix, namePrefixes) &&
    isInRangeOfOptions(nameSuffix, nameSuffixes) &&
    (aug === 1 || aug === 0)
  );
}

function isInRangeOfOptions(index: number, options: string[]) {
  return 0 < index && index <= options.length;
}

export function ringToString({material, suffix, namePrefix, nameSuffix, aug}, plural = false) {
  if (!isValidRing({material, suffix, namePrefix, nameSuffix, aug})) {
    throw new Error('Invalid ring ' + JSON.stringify({material, suffix, namePrefix, nameSuffix, aug}));
  }

  let result = rings[material - 1];
  if (plural) {
    result += 's';
  }
  if (suffix > 0) {
    result += ' ' + suffixes[suffix - 1];
  }
  if (namePrefix > 0) {
    result = '"' + namePrefixes[namePrefix - 1] + ' ' + nameSuffixes[nameSuffix - 1] + '" ' + result;
  }
  if (aug) {
    result += ' +1';
  }
  return result;
}

export const rings = ['Gold Ring', 'Silver Ring', 'Bronze Ring', 'Platinum Ring', 'Titanium Ring'];

const suffixes = [
  'of Power',
  'of Giants',
  'of Titans',
  'of Skill',
  'of Perfection',
  'of Brilliance',
  'of Enlightenment',
  'of Protection',
  'of Anger',
  'of Rage',
  'of Fury',
  'of Vitriol',
  'of the Fox',
  'of Detection',
  'of Reflection',
  'of the Twins',
];

const namePrefixes = [
  'Agony',
  'Apocalypse',
  'Armageddon',
  'Beast',
  'Behemoth',
  'Blight',
  'Blood',
  'Bramble',
  'Brimstone',
  'Brood',
  'Carrion',
  'Cataclysm',
  'Chimeric',
  'Corpse',
  'Corruption',
  'Damnation',
  'Death',
  'Demon',
  'Dire',
  'Dragon',
  'Dread',
  'Doom',
  'Dusk',
  'Eagle',
  'Empyrean',
  'Fate',
  'Foe',
  'Gale',
  'Ghoul',
  'Gloom',
  'Glyph',
  'Golem',
  'Grim',
  'Hate',
  'Havoc',
  'Honour',
  'Horror',
  'Hypnotic',
  'Kraken',
  'Loath',
  'Maelstrom',
  'Mind',
  'Miracle',
  'Morbid',
  'Oblivion',
  'Onslaught',
  'Pain',
  'Pandemonium',
  'Phoenix',
  'Plague',
  'Rage',
  'Rapture',
  'Rune',
  'Skull',
  'Sol',
  'Soul',
  'Sorrow',
  'Spirit',
  'Storm',
  'Tempest',
  'Torment',
  'Vengeance',
  'Victory',
  'Viper',
  'Vortex',
  'Woe',
  'Wrath',
  "Light's",
  'Shimmering',
];

const nameSuffixes = [
  'Bane',
  'Root',
  'Bite',
  'Song',
  'Roar',
  'Grasp',
  'Instrument',
  'Glow',
  'Bender',
  'Shadow',
  'Whisper',
  'Shout',
  'Growl',
  'Tear',
  'Peak',
  'Form',
  'Sun',
  'Moon',
];
