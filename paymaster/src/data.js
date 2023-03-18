const EPchainId = {
  '0x0576a174D229E3cFA37253523E645A78A0C91B57': 5,
}

const chainData = {
  5: {
    chainId: '5',
    rpc: 'https://endpoints.omniatech.io/v1/eth/goerli/public',
    paymaster: '0x23AcBd5539e9335675DF337462FB8f3fc0777937',
    entryPoints: ['0x0576a174D229E3cFA37253523E645A78A0C91B57'],
    acceptedTokens: [],
  },
}

export { EPchainId, chainData }
