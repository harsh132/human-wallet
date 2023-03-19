// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/interfaces/IERC1271.sol";

import "hardhat/console.sol";

contract ChannelManager {
  uint256 waitingTimeInBlocks;

  struct Channel {
    address sender_signer;
    address recipient_signer;
    uint256 lockedAmount;
  }

  struct CloseRequest {
    uint256 index;
    uint256 senderHasAmount;
    uint256 waitTillBlock;
    bool side; // false(0): sender, true(1): recipient
  }

  // channelId = keccak256(abi.encode(sender_signer, recipient_signer, token))
  mapping(bytes32 => Channel) private channels; // channelId => lockedAmount
  mapping(bytes32 => CloseRequest) private closeRequests;

  event ChannelCreated(address indexed sender, address indexed recipient, address indexed token, uint256 amount);
  event ChannelClosed(address indexed sender, address indexed recipient, address indexed token, uint256 senderHasAmount, uint256 recipientHasAmount);

  constructor(uint256 _waitingTimeInBlocks) {
    waitingTimeInBlocks = _waitingTimeInBlocks;
  }

  function getChannelId(address sender, address recipient, address token) public pure returns (bytes32 channelId) {
    channelId = keccak256(abi.encode(sender, recipient, token));
  }

  function getChannel(bytes32 channelId) external view returns (address sender_signer, address recipient_signer, uint256 lockedAmount) {
    Channel memory channel = channels[channelId];
    return (channel.sender_signer, channel.recipient_signer, channel.lockedAmount);
  }

  function getCloseRequest(bytes32 channelId) external view returns (uint256 index, uint256 senderHasAmount, uint256 waitTillBlock, bool side) {
    CloseRequest memory closeRequest = closeRequests[channelId];
    return (closeRequest.index, closeRequest.senderHasAmount, closeRequest.waitTillBlock, closeRequest.side);
  }

  function isValidSignatureNow(address wallet, address signer, bytes32 hash, bytes memory signature) internal view returns (bool) {
    hash = ECDSA.toEthSignedMessageHash(hash);
    (address recovered, ECDSA.RecoverError error) = ECDSA.tryRecover(hash, signature);
    if (error == ECDSA.RecoverError.NoError && (recovered == signer || recovered == wallet)) return true;

    (bool success, bytes memory result) = wallet.staticcall(abi.encodeWithSelector(IERC1271.isValidSignature.selector, hash, signature));
    return (success && result.length == 32 && abi.decode(result, (bytes32)) == bytes32(IERC1271.isValidSignature.selector));
  }

  function createChannel(address sender, address recipient, address sender_signer, address recipient_signer) public payable {
    require(msg.value > 0, "CM: Amount 0");
    address token = address(0);
    bytes32 channelId = keccak256(abi.encode(sender, recipient, token));
    channels[channelId] = Channel(sender_signer, recipient_signer, msg.value);

    emit ChannelCreated(sender, recipient, token, msg.value);
  }

  function createChannelERC20(address sender, address recipient, address sender_signer, address recipient_signer, address token, uint256 amount) public {
    require(amount > 0, "CM: Amount 0");
    bytes32 channelId = keccak256(abi.encode(sender, recipient, token));
    IERC20(token).transferFrom(msg.sender, address(this), amount);
    channels[channelId] = Channel(sender_signer, recipient_signer, amount);

    emit ChannelCreated(sender, recipient, token, amount);
  }

  function _pay(address sender, address recipient, address token, uint256 senderHasAmount, uint256 recipientHasAmount) private {
    if (token == address(0)) {
      payable(sender).transfer(senderHasAmount);
      payable(recipient).transfer(recipientHasAmount);
    } else {
      IERC20(token).transfer(sender, senderHasAmount);
      IERC20(token).transfer(recipient, recipientHasAmount);
    }
  }

  function getHash(address sender, address recipient, address token, uint256 senderHasAmount, uint256 index) public view returns (bytes32) {
    console.log("chainid %s", block.chainid);
    return keccak256(abi.encode(block.chainid, sender, recipient, token, senderHasAmount, index));
  }

  //close with both side's consent
  function closeChannel(address sender, address recipient, address token, uint256 senderHasAmount, bytes memory sender_signature, bytes memory recipient_signature) public {
    bytes32 channelId = keccak256(abi.encode(sender, recipient, token));
    bytes32 hash = keccak256(abi.encode(block.chainid, sender, recipient, token, senderHasAmount, 0));

    Channel memory channel = channels[channelId];
    address sender_signer = channel.sender_signer;
    address recipient_signer = channel.recipient_signer;
    uint256 lockedAmount = channel.lockedAmount;
    uint256 recipientHasAmount;

    require(senderHasAmount <= lockedAmount, "CM: Invalid remaining amount");
    require(isValidSignatureNow(sender, sender_signer, hash, sender_signature), "CM: Invalid sender signature");
    require(isValidSignatureNow(recipient, recipient_signer, hash, recipient_signature), "CM: Invalid recipient signature");

    unchecked {
      recipientHasAmount = lockedAmount - senderHasAmount;
    }

    delete channels[channelId];
    delete closeRequests[channelId];

    _pay(sender, recipient, token, senderHasAmount, recipientHasAmount);
  }

  //close with only one side's consent // side = false(0): sender, true(1): recipient
  function closeChannelOneSide(address sender, address recipient, address token, uint256 senderHasAmount, uint256 index, bool side, bytes memory signature) public {
    require(index > 0, "CM: Invalid index");

    bytes32 channelId = keccak256(abi.encode(sender, recipient, token));
    bytes32 hash = keccak256(abi.encode(block.chainid, sender, recipient, token, senderHasAmount, index));
    Channel memory channel = channels[channelId];
    uint256 lockedAmount = channel.lockedAmount;
    uint256 recipientHasAmount = lockedAmount - senderHasAmount;

    require(senderHasAmount <= lockedAmount, "CM: Invalid remaining amount");
    if (side) {
      require(isValidSignatureNow(recipient, channel.recipient_signer, hash, signature), "CM: Invalid recipient signature");
    } else {
      require(isValidSignatureNow(sender, channel.sender_signer, hash, signature), "CM: Invalid sender signature");
    }

    CloseRequest memory closeRequest = closeRequests[channelId];

    if (closeRequest.index < index) {
      closeRequests[channelId] = CloseRequest(index, senderHasAmount, block.number + waitingTimeInBlocks, side);
    } else if (closeRequest.index == index && closeRequest.side != side && closeRequest.senderHasAmount == senderHasAmount) {
      delete channels[channelId];
      delete closeRequests[channelId];

      _pay(sender, recipient, token, senderHasAmount, recipientHasAmount);
    }
  }

  function withdraw(address sender, address recipient, address token) public {
    bytes32 channelId = keccak256(abi.encode(sender, recipient, token));

    Channel memory channel = channels[channelId];
    CloseRequest memory closeRequest = closeRequests[channelId];

    require(closeRequest.index > 0, "CM: No close request");
    require(closeRequest.waitTillBlock <= block.number, "CM: Withdrawal not allowed yet");

    delete channels[channelId];
    delete closeRequests[channelId];

    uint256 senderHasAmount = closeRequest.senderHasAmount;
    uint256 recipientHasAmount = channel.lockedAmount - senderHasAmount;

    _pay(sender, recipient, token, senderHasAmount, recipientHasAmount);
  }
}
