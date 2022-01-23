/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['ipfs.io', 'rings-for-loot.s3.us-west-2.amazonaws.com']
  },
  env: {
    INFURA_PROJECT_ID: process.env.INFURA_PROJECT_ID,
    TRPC_HOST: process.env.TRPC_HOST,
    WHITELIST_SIGNER_MNEMONIC: process.env.WHITELIST_SIGNER_MNEMONIC,
  },
};
