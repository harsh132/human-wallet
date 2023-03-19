interface UserOp {
  sender: string
  nonce: string
  initCode: string
  callData: string
  callGasLimit: string
  verificationGasLimit: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  paymasterAndData: string
  preVerificationGas: string
  signature: string
}

interface State {
  chainId: string
  sender: string
  recipient: string
  token: string
  senderHasAmount: string
  index: string
  signature: string
}

interface ChainInfo {
  chainId: string
  rpc: string
  paymaster: string
  entryPoints: string[]
  acceptedTokens: string[]
  channelManager: string
}

export { UserOp, State, ChainInfo }
