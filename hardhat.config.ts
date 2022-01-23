require('dotenv').config({path: '.env.local'});
import '@typechain/hardhat';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import 'hardhat-contract-sizer';

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: '0.8.9',
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  contractSizer: {
    alphaSort: false,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
  networks: {
    rinkeby: {
      url: 'https://rinkeby-light.eth.linkpool.io/',
      accounts: [process.env.RINKEBY_DEPLOYER],
    },
    mainnet: {
      url: 'https://main-light.eth.linkpool.io/',
      accounts: [process.env.MAINNET_DEPLOYER],
    },
  },
  etherscan: {
    apiKey: 'J7CYJWPWCJRESRB4W8U5SNVCC7881TWNX4',
  },
};
