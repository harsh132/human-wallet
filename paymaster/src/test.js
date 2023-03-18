import { ethers } from 'ethers'
import { getHash } from './utils.js'

const userOp = {
  sender: '0x59C534A8DA2bc1c2217D8388d2B3b8C3e07BE872',
  nonce: '0x1',
  initCode: '0x',
  callData:
    '0xb61d27f6000000000000000000000000c388c1cd6a7ddc783e982f04317f8fe804b7821f00000000000000000000000000000000000000000000000000038d7ea4c6800000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000',
  callGasLimit: '0x9a8b',
  verificationGasLimit: '0x186a0',
  maxFeePerGas: '0x19a30ca902',
  maxPriorityFeePerGas: '0xa1a5d60',
  paymasterAndData:
    '0x23acbd5539e9335675df337462fb8f3fc07779370000000000000000000000000000000000000000000000000000ffffffffffc80000000000000000000000000000000000000000000000000000000000000001c5754b774d57f5049132cbf3f46d0290bca0675419ecb2b7f9579085ce8527d66190ef888bd4fafc7145a78b8ad6a67cec85423c0e4903120767f88c2b9b11051c',
  preVerificationGas: '0xc088',
  signature: '0xa8c51d688c76db05c48fff18d4d34615b51d152e69f55cd1d1576e68def098fd0510d4311cdff26d3fef0e9c64e789468616b700e2614d49416bdf809087a5011b',
}

// const arrayOp = [
//   userOp.sender,
//   userOp.nonce,
//   userOp.initCode,
//   userOp.callData,
//   userOp.callGasLimit,
//   userOp.verificationGasLimit,
//   userOp.preVerificationGas,
//   userOp.maxFeePerGas,
//   userOp.maxPriorityFeePerGas,
// ]

// make an array of all values in above json
// const data = Object.values(userOp)

// console.log(JSON.stringify(arrayOp))

// const a = [
//   '0x59C534A8DA2bc1c2217D8388d2B3b8C3e07BE872',
//   '0x0',
//   '0x',
//   '0xb61d27f6000000000000000000000000c388c1cd6a7ddc783e982f04317f8fe804b7821f00000000000000000000000000000000000000000000000000038d7ea4c6800000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000',
//   '0x9a8b',
//   '0x186a0',
//   '0xb714',
//   '0x49c48982',
//   '0xa4e95a',
//   '0x',
//   '0x287d0c5d9b3090ea27e359bfa8bb0df352a8b270ba01bd5a1d5ef5b81308937a0773c0933cf3b17dd77cc431a4651bd53edb1d9424107e0a4b0ecb2b4094fb541b',
// ]

// let packedData = ethers.utils.defaultAbiCoder.encode(['address', 'uint256', 'bytes', 'bytes', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes', 'bytes'], arraydata.concat(['0x', '0x']))
// packedData = packedData.slice(0, 4 - 1 * (userOp.paymasterAndData.length + userOp.signature.length))
// console.log(packedData)

const chainId = 5
const paymaster = '0x23AcBd5539e9335675DF337462FB8f3fc0777937'
const nonce = 0
const validUntil = 281474976710600
const validAfter = 1
// const b = ethers.utils.defaultAbiCoder.encode(['bytes', 'uint256', 'address', 'uint256', 'uint48', 'uint48'], [packedData, chainId, paymasterContract, nonce, validUntil, validAfter])

// console.log(ethers.utils.keccak256(packedData))

// const getHash = (uop, chainId, paymaster, nonce, validUntil, validAfter) => {
//   const arrayData = [uop.sender, uop.nonce, uop.initCode, uop.callData, uop.callGasLimit, uop.verificationGasLimit, uop.preVerificationGas, uop.maxFeePerGas, uop.maxPriorityFeePerGas]
//   console.log('arrayData', JSON.stringify(arrayData))

//   const packedData = ethers.utils.defaultAbiCoder.encode(['address', 'uint256', 'bytes', 'bytes', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'], arrayData)
//   console.log('packedData : ', packedData)
//   const encodedData = ethers.utils.defaultAbiCoder.encode(['bytes', 'uint256', 'address', 'uint256', 'uint48', 'uint48'], [packedData, chainId, paymaster, nonce, validUntil, validAfter])
//   console.log('encodedData', encodedData)
//   return ethers.utils.keccak256(encodedData)
// }

console.log(
  JSON.stringify([
    userOp.sender,
    userOp.nonce,
    userOp.initCode,
    userOp.callData,
    userOp.callGasLimit,
    userOp.verificationGasLimit,
    userOp.preVerificationGas,
    userOp.maxFeePerGas,
    userOp.maxPriorityFeePerGas,
    userOp.paymasterAndData,
    userOp.signature,
  ])
)

const hash = getHash({ uop: userOp, chainId, paymaster, nonce, validUntil, validAfter })
console.log(hash)

console.log(
  ethers.utils.verifyMessage(
    ethers.utils.arrayify('0x01219f2b0255174a6ed5ef472aa274c26ffc307afd688607f2ac1fc035f8c02d'),
    '0xc5754b774d57f5049132cbf3f46d0290bca0675419ecb2b7f9579085ce8527d66190ef888bd4fafc7145a78b8ad6a67cec85423c0e4903120767f88c2b9b11051c'
  )
)
