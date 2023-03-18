const { ethers } = require("hardhat");
const { config } = require("dotenv");
const { expect } = require("chai");
// const { keccak256, arrayify } = require("ethers/lib/utils");
const { keccak256, arrayify, defaultAbiCoder } = ethers.utils;

config();

describe("Test1", () => {
  it("Payment Channel Test", async () => {
    const [wallet1, signer1, wallet2, signer2] = await ethers.getSigners(4);

    // console.log(wallet1.address, ethers.utils.formatUnits(await wallet1.getBalance(), "ether"));

    const checkBalance = async (wallet, log = "") => {
      console.log(log, wallet.address, ethers.utils.formatUnits(await ethers.provider.getBalance(wallet.address), "ether"));
    };

    checkBalance(wallet1, "wallet1");
    checkBalance(wallet2, "wallet2");
    checkBalance(signer1, "signer1");
    checkBalance(signer2, "signer2");

    const ChannelManager = await ethers.getContractFactory("ChannelManager");
    const channelManager = await ChannelManager.deploy(10);
    await channelManager.deployed();

    const res1 = await channelManager.createChannel(wallet1.address, wallet2.address, signer1.address, signer2.address, { value: ethers.utils.parseEther("1000.0") });

    checkBalance(wallet1, "wallet1");
    checkBalance(wallet2, "wallet2");
    checkBalance(signer1, "signer1");
    checkBalance(signer2, "signer2");
    // console.log(res);
    const newState = async ({ sender, receiver, token, remainingAmount, signer }) => {
      const channelId = keccak256(defaultAbiCoder.encode(["address", "address", "address"], [sender, receiver, token]));
      const hash = keccak256(defaultAbiCoder.encode(["uint256", "address", "address", "address", "uint256", "uint256"], [31337, sender, receiver, token, remainingAmount, 0]));
      // const ethHash =
      console.log("hash", hash);
      const signature = await signer.signMessage(arrayify(hash));
      console.log("signature", signature);
      return signature;
    };

    console.log("contrcat hash", await channelManager.getHash(wallet1.address, wallet2.address, ethers.constants.AddressZero, ethers.utils.parseEther("800.0"), 0));

    const signature1 = await newState({ sender: wallet1.address, receiver: wallet2.address, token: ethers.constants.AddressZero, remainingAmount: ethers.utils.parseEther("800.0"), signer: signer1 });
    const signature2 = await newState({ sender: wallet1.address, receiver: wallet2.address, token: ethers.constants.AddressZero, remainingAmount: ethers.utils.parseEther("800.0"), signer: signer2 });
    const res2 = await channelManager.closeChannel(wallet1.address, wallet2.address, ethers.constants.AddressZero, ethers.utils.parseEther("800.0"), arrayify(signature1), arrayify(signature2));

    checkBalance(wallet1, "wallet1");
    checkBalance(wallet2, "wallet2");
    checkBalance(signer1, "signer1");
    checkBalance(signer2, "signer2");
  });
});
