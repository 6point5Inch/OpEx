// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20 as OpenZeppelinSafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./OptionNFT.sol";

contract OptionEngine is Ownable, ReentrancyGuard, IERC721Receiver {
    using OpenZeppelinSafeERC20 for IERC20;

    OptionNFT public nft;

    struct Option {
        uint256 id;
        address creator;
        address underlyingToken;
        address quoteToken;
        uint256 strike;
        uint256 size;
        uint256 expiry;
        bool isCall;
        uint256 collateralAmount;
        bool exercised;
        bool active;
    }

    address public optionHook;
    mapping(uint256 => Option) public options;

    event OptionCreated(uint256 indexed optionId, address indexed creator);
    event OptionTransferred(uint256 indexed optionId, address indexed to);
    event OptionExercised(uint256 indexed optionId, address indexed exerciser);

    constructor(OptionNFT _nft) Ownable(msg.sender) {
        nft = _nft;
    }

    modifier onlyHook() {
        require(msg.sender == optionHook, "only hook");
        _;
    }

    function setOptionHook(address hook) external onlyOwner {
        optionHook = hook;
    }

    function createOption(
        address underlyingToken,
        address quoteToken,
        uint256 strike,
        uint256 size,
        uint256 expiry,
        bool isCall,
        uint256 collateralAmount,
        string calldata metadataURI
    ) external nonReentrant returns (uint256 tokenId) {
        require(expiry > block.timestamp, "expiry in past");

        tokenId = nft.mint(address(this), metadataURI);

        Option storage o = options[tokenId];
        o.id = tokenId;
        o.creator = msg.sender;
        o.underlyingToken = underlyingToken;
        o.quoteToken = quoteToken;
        o.strike = strike;
        o.size = size;
        o.expiry = expiry;
        o.isCall = isCall;
        o.collateralAmount = collateralAmount;
        o.exercised = false;
        o.active = true;

        // Transfer collateral from creator to this contract
        // IERC20(underlyingToken).safeTransferFrom(msg.sender, address(this), collateralAmount);

        emit OptionCreated(tokenId, msg.sender);
        return tokenId;
    }

    function createOptionFor(
        address creator,
        address underlyingToken,
        address quoteToken,
        uint256 strike,
        uint256 size,
        uint256 expiry,
        bool isCall,
        uint256 collateralAmount,
        string calldata metadataURI
    ) external onlyHook nonReentrant returns (uint256 tokenId) {
        require(expiry > block.timestamp, "expiry in past");

        tokenId = nft.mint(address(this), metadataURI);

        Option storage o = options[tokenId];
        o.id = tokenId;
        o.creator = creator;
        o.underlyingToken = underlyingToken;
        o.quoteToken = quoteToken;
        o.strike = strike;
        o.size = size;
        o.expiry = expiry;
        o.isCall = isCall;
        o.collateralAmount = collateralAmount;
        o.exercised = false;
        o.active = true;

        // if (collateralAmount > 0) {
        //     address collateralToken = isCall ? underlyingToken : quoteToken;
        //     IERC20(collateralToken).safeTransferFrom(creator, address(this), collateralAmount);
        // }

        emit OptionCreated(tokenId, creator);
    }

    function transferOption(uint256 optionId, address to) public onlyOwner {
        require(options[optionId].active, "not active");
        nft.safeTransferFrom(address(this), to, optionId);
        emit OptionTransferred(optionId, to);
    }

    function transferOptionTo(uint256 optionId, address to) external onlyOwner {
        transferOption(optionId, to);
    }

    function exercise(uint256 optionId) external nonReentrant {
        Option storage o = options[optionId];
        require(o.active, "inactive");
        require(!o.exercised, "already exercised");
        require(block.timestamp <= o.expiry, "expired");

        address holder = nft.ownerOf(optionId);
        require(holder == msg.sender, "not holder");

        o.exercised = true;
        o.active = false;

        if (o.isCall) {
            // For call option: buyer pays strike price in quote token to get underlying
            // strike is in quote token units, size is in underlying units
            // Need to adjust for decimals: (strike * size) / (10^underlying_decimals)
            uint256 strikeAmount = mulDiv(o.strike, o.size, 10 ** 18); // Assuming 18 decimals for underlying

            IERC20(o.quoteToken).safeTransferFrom(holder, o.creator, strikeAmount);

            IERC20(o.underlyingToken).safeTransfer(holder, o.size);
        } else {
            // For put option: buyer sells underlying at strike price
            IERC20(o.underlyingToken).safeTransferFrom(holder, address(this), o.size);
            uint256 payout = mulDiv(o.strike, o.size, 10 ** 18); // Assuming 18 decimals for underlying

            IERC20(o.quoteToken).safeTransfer(holder, payout);

            IERC20(o.underlyingToken).safeTransfer(o.creator, o.size);
        }

        nft.burn(optionId);
        emit OptionExercised(optionId, msg.sender);
    }

    function mulDiv(uint256 a, uint256 b, uint256 denominator) internal pure returns (uint256) {
        return (a * b) / denominator;
    }

    // Required by IERC721Receiver to accept NFT transfers
    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
