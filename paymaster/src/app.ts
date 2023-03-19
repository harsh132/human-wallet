import express from 'express'
import bodyParser from 'body-parser'
import { JSONRPCServer } from 'json-rpc-2.0'
import { BigNumber, ethers } from 'ethers'
const { keccak256, arrayify, defaultAbiCoder, verifyMessage, isAddress } = ethers.utils
// import { getHash } from './utils.js's
import { EPchainId, chainData } from './data.js'
import { UserOp, State, ChainInfo } from './interfaces.js'
import { config } from 'dotenv'
import paymasterABI from './paymasterABI.json' assert { type: 'json' }
import channelManagerABI from './channelManagerABI.json' assert { type: 'json' }
config()
import Datastore from 'nedb'
const db = new Datastore({ filename: 'db/channels.db', autoload: true })

const server = new JSONRPCServer()

const approveUserOp = async ({ userOp, chainInfo }: { userOp: UserOp; chainInfo: ChainInfo }) => {
  const provider = new ethers.providers.JsonRpcProvider(chainInfo.rpc)
  const paymasterContract = new ethers.Contract(chainInfo.paymaster, paymasterABI, provider)
  const validUntil = 281474976710600
  const validAfter = 1

  const arrayData = [
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
  ]
  const hash = await paymasterContract.getHash(arrayData, validUntil, validAfter)
  console.log('Hash :', hash)

  const wallet = new ethers.Wallet(process.env.PAYMASTER_PRIVATE_KEY)
  const signature = await wallet.signMessage(arrayify(hash))
  console.log('Signature :', signature)

  const paymasterAndData = ethers.utils.solidityPack(['address', 'uint256', 'uint256', 'bytes'], [chainInfo.paymaster, validUntil, validAfter, signature])
  return paymasterAndData
}

const validateState = async ({ state, signer }: { state: State; signer: string }) => {
  const { chainId, sender, recipient, token, senderHasAmount, index, signature } = state
  if (isAddress(sender) == false) return 'Error: Sender is not a valid address'
  if (isAddress(recipient) == false) return 'Error: Recipient is not a valid address'
  if (isAddress(token) == false) return 'Error: Token is not a valid address'
  if (BigNumber.from(senderHasAmount).lte(BigNumber.from(0))) return 'Error: Sender has amount is not valid'
  if (BigNumber.from(index).lte(BigNumber.from(0))) return 'Error: Index is not valid'
  if (BigNumber.from(chainId).lte(BigNumber.from(0))) return 'Error: ChainId is not valid'

  const chainInfo = chainData[chainId]
  if (chainInfo == undefined) return 'Error: ChainId is not supported'
  if (chainInfo.acceptedTokens.has(token) == false) return 'Error: Token is not accepted on this chain'

  if (recipient != process.env.PAYMASTER_PUBLIC_KEY) return 'Error: Recipient is not the paymaster'

  const hash = keccak256(defaultAbiCoder.encode(['uint256', 'address', 'address', 'address', 'uint256', 'uint256'], [chainId, sender, recipient, token, senderHasAmount, index]))
  const recoveredAddress = verifyMessage(arrayify(hash), signature)
  if (recoveredAddress != signer) return 'Error: Signature is not valid'
  return true
}

const getChannelId = (sender: string, recipient: string, token: string) => {
  return keccak256(defaultAbiCoder.encode(['address', 'address', 'address'], [sender, recipient, token]))
}

const channelCreated = async ({ state, signer }: { state: State; signer: string }) => {
  const validation = await validateState({ state, signer })
  if (validation != true) return validation

  const { chainId, sender, recipient, token, senderHasAmount, index } = state
  if (index != '1') return 'Error: Unexpected index'

  const chainInfo = chainData[chainId]

  const channelId = getChannelId(sender, recipient, token)
  const provider = new ethers.providers.JsonRpcProvider(chainInfo.rpc)
  const paymentChannelContract = new ethers.Contract(chainInfo.channelManager, channelManagerABI, provider)

  const channel = await paymentChannelContract.getChannels(arrayify(channelId))
  if (channel[0] != signer) return 'Error: Invalid channel'
  if (channel[1] != process.env.PAYMASTER_PUBLIC_KEY) return 'Error: Invalid channel'
}

server.addMethod('pm_sponsorUserOperation', async req => {
  // console.log(JSON.stringify(req, null, 2))
  const userOp: UserOp = req[0]
  const entryPoint = req[1]
  const newState: State = req[2]
  console.log('Sponsor User Operation :', userOp)
  console.log('Entry Point :', entryPoint)
  console.log('New State :', newState)

  const chainId = EPchainId[entryPoint]
  const chainInfo: ChainInfo = chainData[chainId]

  const preveousState = db.findOne({ chainId: newState.chainId, sender: newState.sender, recipient: process.env.PAYMASTER_PUBLIC_KEY, token: newState.token }, function (err, doc) {})

  return await approveUserOp({ userOp, chainInfo })
})

server.addMethod('pm_supportedEntryPoints', req => {
  const chainId = req[0]
  console.log('Chain ID :', chainId)
  return chainData[chainId].entryPoints
})

const app = express()
app.use(bodyParser.json())
const port = 3000

app.post('/json-rpc', (req, res) => {
  const jsonRPCRequest = req.body
  server.receive(jsonRPCRequest).then(jsonRPCResponse => {
    if (jsonRPCResponse) {
      res.json(jsonRPCResponse)
    } else {
      res.sendStatus(204)
    }
  })
})

app.listen(port, () => {
  console.log(`Paymaster listening on port ${port}`)
})
