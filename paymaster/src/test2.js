import { ethers } from 'ethers'

const wallet = new ethers.Wallet('0x205cbdc8190169c192895feab474522ae8eeb23a7fbfa1ac3f421f0447019bdb')
console.log('Address :', wallet.address)

const signature = await wallet.signMessage('0x1234')
console.log('Signature :', signature)

const data = ethers.utils.solidityPack(['address', 'uint256', 'uint256', 'bytes'], ['0xe4B8b477AFE33F5Dd54A7C47E172650f1106740E', 11, 22, signature])

console.log('Data :', data)
