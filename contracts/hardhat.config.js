require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      // forking: {
      //   url: "https://eth-goerli.g.alchemy.com/v2/wo1-QUJJIrsfSRRq5IKKL5hgqvqKhHmW",
      // },
    },
    goerli: {
      url: "https://eth-goerli.g.alchemy.com/v2/wo1-QUJJIrsfSRRq5IKKL5hgqvqKhHmW",
    },
  },
};
