// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20 as OpenZeppelinSafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./OptionEngine.sol";
import "./interfaces/IOrderMixin.sol";
import "./interfaces/IPreInteraction.sol";
import "./interfaces/IPostInteraction.sol";

contract OptionHook is Ownable(msg.sender), ReentrancyGuard, IPreInteraction, IPostInteraction {
    using OpenZeppelinSafeERC20 for IERC20;

    OptionEngine public engine;
    mapping(bytes32 => uint256) public optionCreatedForOrder;
    address public orderMixinCaller;

    event PreInterCalled(address caller, uint256 optionId, uint8 action, uint256 premium);
    event PostInterCalled(address caller, uint256 optionId, uint8 action, address taker);

    constructor(OptionEngine _engine) {
        engine = _engine;
    }

    function setOrderMixinCaller(address addr) external onlyOwner {
        orderMixinCaller = addr;
    }

    /// Compute a simple on-chain premium (example)
    function computePremiumOnchain(uint256 optionId) public view returns (uint256) {
        // destructure ALL return values explicitly (no typed blanks)
        (
            uint256 id,
            address creator,
            address underlyingToken,
            address quoteToken,
            uint256 strike,
            uint256 size,
            uint256 expiry,
            bool isCall,
            uint256 collateralAmount,
            bool active
        ) = _readOption(optionId);

        // simple model: base = strike * size / 100
        uint256 base = (strike * size) / 100;
        uint256 timeLeft = expiry > block.timestamp ? expiry - block.timestamp : 0;
        uint256 timeFactor = timeLeft / 1 days;
        return base + (timeFactor * 1e12);
    }

    /**
     * NOTE: signature must exactly match interface: no return value.
     * We emit an event with computed premium for off-chain observation.
     */
    function preInteraction(
        IOrderMixin.Order calldata,
        bytes calldata extension,
        bytes32 orderHash,
        address,
        uint256,
        uint256,
        uint256,
        bytes calldata data
    ) external override {
        if (orderMixinCaller != address(0)) require(msg.sender == orderMixinCaller, "unauth caller");

        (uint256 optionId, bool needsCreate) = _parseExtForCreate(extension);

        if (optionCreatedForOrder[orderHash] != 0) {
            uint256 existing = optionCreatedForOrder[orderHash];
            uint256 premium = _engineComputePremium(existing);
            emit PreInterCalled(msg.sender, existing, 0, premium);
            return;
        } else {
            // if (needsCreate) {
            uint256 newId = _createOptionFromData(data, orderHash);
            uint256 premium = 1000;
            emit PreInterCalled(msg.sender, newId, 0, premium);
            return;
        }

        // nothing to do
        // emit PreInterCalled(msg.sender, optionId, 0, 696969);
    }

    function _createOptionFromData(bytes calldata data, bytes32 orderHash) internal returns (uint256) {
        // Expect encoding:
        // (uint256 optionIdOrZero,
        //  address maker,
        //  address underlying,
        //  address quote,
        //  uint256 strike,
        //  uint256 size,
        //  uint256 expiry,
        //  bool isCall,
        //  uint256 collateralAmount,
        //  string metadataURI)
        (
            uint256 zero,
            address maker,
            address underlying,
            address quote,
            uint256 strike,
            uint256 size,
            uint256 expiry,
            bool isCall,
            uint256 collateralAmount,
            string memory uri
        ) = abi.decode(data, (uint256, address, address, address, uint256, uint256, uint256, bool, uint256, string));

        require(zero == 0, "expected zero optionId for create");
        require(maker != address(0), "invalid maker");

        uint256 newId =
            engine.createOptionFor(maker, underlying, quote, strike, size, expiry, isCall, collateralAmount, uri);

        optionCreatedForOrder[orderHash] = newId;
        return newId;
    }

    function postInteraction(
        IOrderMixin.Order calldata,
        bytes calldata,
        bytes32 orderHash,
        address taker,
        uint256,
        uint256,
        uint256,
        bytes calldata
    ) external override {
        if (orderMixinCaller != address(0)) require(msg.sender == orderMixinCaller, "unauth caller");
        uint256 optionId = optionCreatedForOrder[orderHash];
        require(optionId != 0, "no option created");

        engine.transferOptionTo(optionId, taker);

        delete optionCreatedForOrder[orderHash];
        emit PostInterCalled(msg.sender, optionId, 1, taker);
    }

    function _parseExtForCreate(bytes calldata extension) internal pure returns (uint256 optionId, bool needsCreate) {
        if (extension.length < 32) return (0, false);
        optionId = abi.decode(extension[:32], (uint256));
        needsCreate = (optionId == 0 && extension.length > 32);
    }

    function _engineComputePremium(uint256 optionId) internal view returns (uint256) {
        return computePremiumOnchain(optionId);
    }

    function _readOption(uint256 optionId)
        internal
        view
        returns (
            uint256 id,
            address creator,
            address underlyingToken,
            address quoteToken,
            uint256 strike,
            uint256 size,
            uint256 expiry,
            bool isCall,
            uint256 collateralAmount,
            bool active
        )
    {
        // match OptionEngine.options(...) public getter ordering exactly
        (id, creator, underlyingToken, quoteToken, strike, size, expiry, isCall, collateralAmount,, active) =
            engine.options(optionId);
    }
}
