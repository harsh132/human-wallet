import express from 'express';
import bodyParser from 'body-parser';
import { JSONRPCServer } from 'json-rpc-2.0';
import { ethers } from 'ethers';
const { keccak256, arrayify, defaultAbiCoder, verifyMessage, isAddress } = ethers.utils;
// import { getHash } from './utils.js's
import { EPchainId, chainData } from './data.js';
import { config } from 'dotenv';
import ABI from './paymasterABI.json' assert { type: 'json' };
config();
import Datastore from 'nedb';
const db = new Datastore({ filename: 'db/channels.db', autoload: true });
const server = new JSONRPCServer();
const approveUserOp = async ({ userOp, chainInfo }) => {
    const provider = new ethers.providers.JsonRpcProvider(chainInfo.rpc);
    const paymasterContract = new ethers.Contract(chainInfo.paymaster, ABI, provider);
    const validUntil = 281474976710600;
    const validAfter = 1;
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
    ];
    const hash = await paymasterContract.getHash(arrayData, validUntil, validAfter);
    console.log('Hash :', hash);
    const wallet = new ethers.Wallet(process.env.PAYMASTER_PRIVATE_KEY);
    const signature = await wallet.signMessage(ethers.utils.arrayify(hash));
    console.log('Signature :', signature);
    const paymasterAndData = ethers.utils.solidityPack(['address', 'uint256', 'uint256', 'bytes'], [chainInfo.paymaster, validUntil, validAfter, signature]);
    return paymasterAndData;
};
const validateState = async ({ state, signer }) => {
    const { chainId, sender, recipient, token, senderHasAmount, index, signature } = state;
    const chainInfo = chainData[chainId];
    if (chainInfo == undefined || chainInfo.acceptedTokens.length > 0 || chainInfo.acceptedTokens.ha)
        return 'Error';
    if (recipient != process.env.PAYMASTER_PUBLIC_KEY)
        return 'Error';
    const hash = keccak256(defaultAbiCoder.encode(['uint256', 'address', 'address', 'address', 'uint256', 'uint256'], [chainId, sender, recipient, token, senderHasAmount, index]));
    const recoveredAddress = verifyMessage(arrayify(hash), signature);
    if (recoveredAddress != signer)
        return 'Error';
};
server.addMethod('pm_sponsorUserOperation', async (req) => {
    // console.log(JSON.stringify(req, null, 2))
    const userOp = req[0];
    const entryPoint = req[1];
    const newState = req[2];
    console.log('Sponsor User Operation :', userOp);
    console.log('Entry Point :', entryPoint);
    console.log('New State :', newState);
    const chainId = EPchainId[entryPoint];
    const chainInfo = chainData[chainId];
    if (newState.recipient != process.env.PAYMASTER_PUBLIC_KEY)
        return '0x';
    const preveousState = db.findOne({ chainId: newState.chainId, sender: newState.sender, recipient: process.env.PAYMASTER_PUBLIC_KEY, token: newState.token }, function (err, doc) { });
    return await approveUserOp({ userOp, chainInfo });
});
server.addMethod('pm_supportedEntryPoints', req => {
    const chainId = req[0];
    console.log('Chain ID :', chainId);
    return chainData[chainId].entryPoints;
});
const app = express();
app.use(bodyParser.json());
const port = 3000;
app.post('/json-rpc', (req, res) => {
    const jsonRPCRequest = req.body;
    server.receive(jsonRPCRequest).then(jsonRPCResponse => {
        if (jsonRPCResponse) {
            res.json(jsonRPCResponse);
        }
        else {
            res.sendStatus(204);
        }
    });
});
app.listen(port, () => {
    console.log(`Paymaster listening on port ${port}`);
});
//# sourceMappingURL=app.js.map