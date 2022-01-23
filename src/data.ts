import {ALL_RINGS_DATA} from './gen';

export const RING_ID_TO_MAX_SUPPLY = Object.fromEntries(
  Object.values(ALL_RINGS_DATA).map((ids) => [ids[0], ids.length]),
);
export const BAG_ID_TO_RING_ID = Object.fromEntries(
  Object.values(ALL_RINGS_DATA).flatMap((ids) => ids.map((id) => [id, ids[0]])),
);
export const RING_NAME_TO_RING_ID = Object.fromEntries(
  Object.entries(ALL_RINGS_DATA).map(([name, ids]) => [name, ids[0]]),
);
export const RING_ID_TO_RING_NAME = Object.fromEntries(
  Object.entries(ALL_RINGS_DATA).map(([name, ids]) => [ids[0], name]),
);

export const COMMON_RINGS_IDS = [
  RING_NAME_TO_RING_ID['Gold Ring'],
  RING_NAME_TO_RING_ID['Silver Ring'],
  RING_NAME_TO_RING_ID['Bronze Ring'],
  RING_NAME_TO_RING_ID['Platinum Ring'],
  RING_NAME_TO_RING_ID['Titanium Ring'],
];

export const IPFS_HASH = 'QmNW16FD1WNavuNPJF8viCthNcnjxVMNuQGPsoJZWL9Rzt';

export function ringImageURL2(id: number) {
  return id ? `https://ipfs.io/ipfs/${IPFS_HASH}/${id}.jpg` : '/placeholder.jpg';
}

export function ringImageURL(id: number) {
  return `https://rings-for-loot.s3.us-west-2.amazonaws.com/${id}.jpg`;
}
