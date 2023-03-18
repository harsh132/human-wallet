import { ethers } from 'ethers'

const getHash = ({ uop, chainId, paymaster, nonce, validUntil, validAfter }) => {
  const packedData = ethers.utils.defaultAbiCoder.encode(
    ['address', 'uint256', 'bytes', 'bytes', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
    [uop.sender, uop.nonce, uop.initCode, uop.callData, uop.callGasLimit, uop.verificationGasLimit, uop.preVerificationGas, uop.maxFeePerGas, uop.maxPriorityFeePerGas]
  )
  // console.log(packedData)
  const encodedData = ethers.utils.defaultAbiCoder.encode(['bytes', 'uint256', 'address', 'uint256', 'uint48', 'uint48'], [packedData, chainId, paymaster, nonce, validUntil, validAfter])
  // console.log(encodedData)
  return ethers.utils.keccak256(encodedData)
}

export { getHash }
