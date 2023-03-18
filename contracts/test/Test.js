const { ethers } = require("hardhat");
const { config } = require("dotenv");
const { expect } = require("chai");
config();

describe("Test1", () => {
  it("match Hash", async () => {
    // const accounts = await ethers.getSigners(2);
    const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY);
    const walletSigner = wallet.address;
    const paymasterWallet = new ethers.Wallet(process.env.PAYMASTER_PRIVATE_KEY);
    const paymasterSigner = paymasterWallet.address;

    const EP = await ethers.getImpersonatedSigner("0x0576a174D229E3cFA37253523E645A78A0C91B57");
    // console.log("admin", admin, paymasterSigner);

    const VerifyingPaymaster = await ethers.getContractFactory("VerifyingPaymaster");

    const verifyingPaymaster = await VerifyingPaymaster.deploy("0x0576a174D229E3cFA37253523E645A78A0C91B57", paymasterSigner);
    await verifyingPaymaster.deployed();

    const uop = {
      sender: "0x59C534A8DA2bc1c2217D8388d2B3b8C3e07BE872",
      nonce: "0x1",
      initCode: "0x",
      callData:
        "0xb61d27f6000000000000000000000000c388c1cd6a7ddc783e982f04317f8fe804b7821f00000000000000000000000000000000000000000000000000038d7ea4c6800000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000",
      callGasLimit: "0x9a8b",
      verificationGasLimit: "0x186a0",
      maxFeePerGas: "0x19a30ca902",
      maxPriorityFeePerGas: "0xa1a5d60",
      paymasterAndData:
        "0x23acbd5539e9335675df337462fb8f3fc07779370000000000000000000000000000000000000000000000000000ffffffffffc80000000000000000000000000000000000000000000000000000000000000001c5754b774d57f5049132cbf3f46d0290bca0675419ecb2b7f9579085ce8527d66190ef888bd4fafc7145a78b8ad6a67cec85423c0e4903120767f88c2b9b11051c",
      preVerificationGas: "0xc088",
      signature: "0xa8c51d688c76db05c48fff18d4d34615b51d152e69f55cd1d1576e68def098fd0510d4311cdff26d3fef0e9c64e789468616b700e2614d49416bdf809087a5011b",
    };

    // const getHash = ({ uop, chainId, paymaster, nonce, validUntil, validAfter }) => {
    //   const packedData = ethers.utils.defaultAbiCoder.encode(
    //     ["address", "uint256", "bytes", "bytes", "uint256", "uint256", "uint256", "uint256", "uint256"],
    //     [uop.sender, uop.nonce, uop.initCode, uop.callData, uop.callGasLimit, uop.verificationGasLimit, uop.preVerificationGas, uop.maxFeePerGas, uop.maxPriorityFeePerGas]
    //   );
    //   // console.log(packedData)
    //   const encodedData = ethers.utils.defaultAbiCoder.encode(["bytes", "uint256", "address", "uint256", "uint48", "uint48"], [packedData, chainId, paymaster, nonce, validUntil, validAfter]);
    //   // console.log(encodedData)
    //   return ethers.utils.keccak256(encodedData);
    // };
    const arrayData = [
      uop.sender,
      uop.nonce,
      uop.initCode,
      uop.callData,
      uop.callGasLimit,
      uop.verificationGasLimit,
      uop.preVerificationGas,
      uop.maxFeePerGas,
      uop.maxPriorityFeePerGas,
      uop.paymasterAndData,
      uop.signature,
    ];

    // const getArrayData

    // const chainId = 5;
    // const nonce = 0;
    const validUntil = 1;
    const validAfter = 281474976710600;

    const hash1 = await verifyingPaymaster.getHash(uop, validUntil, validAfter);
    // const hash2 = getHash({ uop, chainId, paymaster: paymasterSigner, nonce, validUntil, validAfter });
    console.log("hash1", hash1);
    console.log("address : ", verifyingPaymaster.address);
    // console.log("hash2", hash2);
    // expect(hash1).to.equal(hash2);
    const sig = await paymasterWallet.signMessage(ethers.utils.arrayify(hash1));
    const paymasterAndData = ethers.utils.solidityPack(["address", "uint256", "uint256", "bytes"], [verifyingPaymaster.address, validUntil, validAfter, sig]);
    console.log("PaymasterandData: ", paymasterAndData);

    uop.paymasterAndData = paymasterAndData;
    // const res = await verifyingPaymaster.connect(EP).validatePaymasterUserOp(uop, hash1, 2);
    const validationResult = await verifyingPaymaster.validateUserOp(uop);
    console.log("res: ", validationResult);
  });
});
