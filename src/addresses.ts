const addresses = {
  loot: {
    '1': '0xFF9C1b15B16263C61d017ee9F65C50e4AE0113D7',
    '4': '0x5503ACa5c031d32f1D13afb06381F8C91c6e90C2',
  },
  mloot: {
    '1': '0x1dfe7ca09e99d10835bf73044a23b73fc20623df',
    '4': '0x3c5D704569f319813EC0720363d2C5B117E5D06b',
  },
  genesis: {
    '1': '0x8dB687aCEb92c66f013e1D614137238Cc698fEdb',
    '4': '0xAD2e742DF1A7622e65788d4dEdc073934419E689',
  },
  rings: {
    '1': '0x73c5013Fa9701425be4a436cA0CeC1C0898e6F14',
    '4': '0x2fE310CeDa00f580Bb678eB4822F08c39d6d094A',
  },
};

export function getAddress(map: Record<string, string>, chainId: number, fallback: boolean = false): string {
  const address = map[chainId.toString()];
  if (address) {
    return address;
  }

  if (fallback) {
    return map[Object.keys(map)[0]];
  }

  throw new Error('Contract address not available on chain ' + chainId);
}

export default addresses;
