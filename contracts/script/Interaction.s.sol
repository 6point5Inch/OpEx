// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/OptionNFT.sol";
import "../src/OptionEngine.sol";
import "../src/OptionHook.sol";
import "../src/LimitOrderProtocol.sol";
import "@1inch/solidity-utils/contracts/interfaces/IWETH.sol";
import "../src/interfaces/IOrderMixin.sol";
import {Address} from "@1inch/solidity-utils/contracts/libraries/AddressLib.sol";
import "@1inch/limit-order-protocol/contracts/libraries/TakerTraitsLib.sol";
import "@1inch/limit-order-protocol/contracts/libraries/MakerTraitsLib.sol";
import "../src/libraries/ExtensionLib.sol";

contract TestERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (from != msg.sender) {
            uint256 allowed = allowance[from][msg.sender];
            require(allowed >= amount, "allowance");
            allowance[from][msg.sender] = allowed - amount;
        }
        require(balanceOf[from] >= amount, "insufficient-from");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

contract InteractScript is Script {
    function _buildExtPrePost(address pre, bytes memory prePayload, address post, bytes memory postPayload)
        internal
        pure
        returns (bytes memory)
    {
        bytes memory preField = pre == address(0) ? bytes("") : abi.encodePacked(bytes20(pre), prePayload);
        bytes memory postField = post == address(0) ? bytes("") : abi.encodePacked(bytes20(post), postPayload);

        uint32 len0 = 0;
        uint32 len1 = 0;
        uint32 len2 = 0;
        uint32 len3 = 0;
        uint32 len4 = 0;
        uint32 len5 = 0;
        uint32 len6 = uint32(preField.length);
        uint32 len7 = uint32(preField.length + postField.length);

        uint256 offsets = 0;
        offsets |= uint256(len0);
        offsets |= uint256(len1) << 32;
        offsets |= uint256(len2) << 64;
        offsets |= uint256(len3) << 96;
        offsets |= uint256(len4) << 128;
        offsets |= uint256(len5) << 160;
        offsets |= uint256(len6) << 192;
        offsets |= uint256(len7) << 224;

        bytes memory concat = abi.encodePacked(preField, postField);
        return abi.encodePacked(bytes32(offsets), concat);
    }

    function run() external {
        // Testnet
        uint256 makerKey = vm.envUint("MAKER_KEY");
        uint256 buyerKey = vm.envUint("BUYER_KEY");

        vm.startBroadcast(makerKey);

        address maker = vm.addr(makerKey);
        address buyer = vm.addr(buyerKey);

        TestERC20 underlying = new TestERC20("Mock Underlying Token", "XUND", 18);
        TestERC20 quote = new TestERC20("Mock Quote Token", "XUSDC", 6);

        underlying.mint(maker, 20 ether);
        quote.mint(buyer, 2_000_000 * (10 ** 6));
        // quote.mint(msg.sender, 10_000_000 * (10 ** 6));

        OptionNFT nft = new OptionNFT("Option Protocol NFT", "OPTNFT");
        OptionEngine engine = new OptionEngine(nft);
        OptionHook hook = new OptionHook(engine);

        LimitOrderProtocol limitOrderProtocol = new LimitOrderProtocol(IWETH(address(0)));

        try nft.transferOwnership(address(engine)) {} catch {}

        engine.setOptionHook(address(hook));
        try engine.transferOwnership(address(hook)) {} catch {}

        try hook.setOrderMixinCaller(address(limitOrderProtocol)) {} catch {}

        console.log("Deployed addresses:");
        console.log(" Underlying:", address(underlying));
        console.log(" Quote:     ", address(quote));
        console.log(" NFT:       ", address(nft));
        console.log(" Engine:    ", address(engine));
        console.log(" Hook:      ", address(hook));
        console.log(" LOP:       ", address(limitOrderProtocol));

        vm.stopBroadcast();

        uint256 strike = 100 * (10 ** 6);
        uint256 size = 1 ether;
        uint256 expiry = block.timestamp + 7 days;
        bool isCall = true;
        uint256 collateralAmount = size;
        uint256 prem = 5 * (10 ** 6);

        vm.startBroadcast(makerKey);
        underlying.approve(address(engine), collateralAmount);
        underlying.approve(address(limitOrderProtocol), size);
        vm.stopBroadcast();

        vm.startBroadcast(makerKey);

        quote.approve(address(limitOrderProtocol), prem);

        MakerTraits makerTraits = MakerTraits.wrap((1 << 255) | (1 << 252) | (1 << 251) | (1 << 249));

        bytes memory extension = _buildExtPrePost(
            address(hook),
            abi.encode(
                uint256(0), // optionIdOrZero - 0 means create new
                maker, // maker address
                address(underlying),
                address(quote),
                strike,
                size,
                expiry,
                isCall,
                collateralAmount,
                "option-metadata-uri"
            ),
            address(hook),
            abi.encodePacked(address(engine))
        );
        uint256 extensionHash = uint256(keccak256(extension));
        uint256 salt = extensionHash & type(uint160).max;

        IOrderMixin.Order memory order = IOrderMixin.Order({
            salt: salt,
            maker: Address.wrap(uint256(uint160(maker))),
            receiver: Address.wrap(0),
            makerAsset: Address.wrap(uint256(uint160(address(underlying)))),
            takerAsset: Address.wrap(uint256(uint160(address(quote)))),
            makingAmount: size,
            takingAmount: prem,
            makerTraits: makerTraits
        });

        bytes32 orderHash = limitOrderProtocol.hashOrder(order);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(makerKey, orderHash);

        bytes32 vs = bytes32(uint256(s) | (uint256(v - 27) << 255));

        uint256 extensionLength = extension.length;
        TakerTraits takerTraits = TakerTraits.wrap((1 << 251) | (extensionLength << 224));

        vm.stopBroadcast();

        // Now switch to buyer (taker) to fill the order
        vm.startBroadcast(buyerKey); // buyer

        // Buyer needs to approve quote token spending
        quote.approve(address(limitOrderProtocol), prem);

        bytes memory args = abi.encodePacked(address(engine), extension);
        (uint256 makingAmount, uint256 takingAmount, bytes32 finalOrderHash) =
            limitOrderProtocol.fillOrderArgs(order, r, vs, prem, takerTraits, args);

        console.log("Order hash:");
        console.logBytes32(finalOrderHash);

        vm.stopBroadcast();

        // Check NFT ownership after the order is filled
        vm.startBroadcast(makerKey);
        uint256 optionId = 1;
        address nftOwner = nft.ownerOf(optionId);
        console.log("NFT owner after order fill:", nftOwner);
        console.log("Buyer address:", buyer);
        require(nftOwner == buyer, "NFT should be owned by buyer (taker)");
        console.log(" NFT successfully transferred to buyer!");

        // Check that engine has received the collateral (underlying tokens)
        uint256 engineUnderlyingBalance = underlying.balanceOf(address(engine));
        console.log("Engine underlying balance:", engineUnderlyingBalance);
        console.log("Expected collateral amount:", size);
        require(engineUnderlyingBalance >= size, "Engine should have received collateral");
        console.log(" Engine successfully received collateral!");

        // Check that maker has received the premium (quote tokens)
        uint256 makerQuoteBalance = quote.balanceOf(maker);
        console.log("Maker quote balance:", makerQuoteBalance);
        console.log("Expected premium:", prem);
        require(makerQuoteBalance >= prem, "Maker should have received premium");
        console.log(" Maker successfully received premium!");

        // Check that the buyer (taker) has spent the premium correctly
        uint256 buyerQuoteBalance = quote.balanceOf(buyer);
        console.log("Buyer quote balance:", buyerQuoteBalance);
        uint256 expectedBuyerBalance = 2_000_000 * (10 ** 6) - prem; // Initial balance minus premium
        console.log("Expected buyer balance:", expectedBuyerBalance);
        require(buyerQuoteBalance == expectedBuyerBalance, "Buyer should have spent exactly the premium");
        console.log(" Buyer correctly spent premium!");

        vm.stopBroadcast();
    }
}

contract ExerciseScript is Script {
    function run() external {
        uint256 makerKey = vm.envUint("MAKER_KEY");
        uint256 buyerKey = vm.envUint("BUYER_KEY");
        vm.startBroadcast(makerKey);

        address maker = vm.addr(makerKey);
        address buyer = vm.addr(buyerKey);

        TestERC20 underlying = TestERC20(vm.envAddress("UNDERLYING_ADDRESS"));
        TestERC20 quote = TestERC20(vm.envAddress("QUOTE_ADDRESS"));
        OptionNFT nft = OptionNFT(vm.envAddress("OPTION_NFT_ADDRESS"));
        OptionEngine engine = OptionEngine(vm.envAddress("ENGINE_CONTRACT"));
        OptionHook hook = OptionHook(vm.envAddress("HOOK_CONTRACT"));
        LimitOrderProtocol limitOrderProtocol = LimitOrderProtocol(payable(vm.envAddress("LIMIT_ORDER_PROTOCOL")));
        uint256 optionId = 1; // The ID of the option NFT to exercise
        uint256 strike = 100 * (10 ** 6);
        uint256 size = 1 ether;
        // Buyer (taker) needs to approve quote token spending for strike price
        uint256 strikeAmount = strike; // For 1 option of size 1 ether,
        vm.stopBroadcast();
        vm.startBroadcast(buyerKey);
        quote.approve(address(engine), strikeAmount);
        // Exercise the option as the buyer (taker)
        vm.stopBroadcast();

        vm.startBroadcast(buyerKey);
        engine.exercise(optionId);
        vm.stopBroadcast();

        vm.startBroadcast(makerKey);
        // Check that the option is marked as exercised
        (, , , , , , , , , , bool active) = engine.options(optionId);
        require(!active, "Option should be inactive after exercise");
        console.log(" Option successfully exercised and marked inactive!");
        // Check that the buyer (taker) now owns the underlying asset
        uint256 buyerUnderlyingBalance = underlying.balanceOf(buyer);
        console.log("Buyer underlying balance after exercise:", buyerUnderlyingBalance);
        console.log("Expected underlying amount:", size);
        require(buyerUnderlyingBalance >= size, "Buyer should have received underlying asset after exercise");
        console.log(" Buyer successfully received underlying asset after exercise!");
        vm.stopBroadcast();
    }
}


contract CheckNFTTransfer is Script {
    function run() external {
        // Local Anvil keys
        uint256 makerKey = vm.envUint("MAKER_KEY");
        uint256 nftHolderKey = vm.envUint("BUYER_KEY");
        uint256 recipientKey = vm.envUint("THIRD_KEY");

        vm.startBroadcast(nftHolderKey);

        address maker = vm.addr(makerKey);
        address nftHolder = vm.addr(nftHolderKey);
        address recipient = vm.addr(recipientKey);

        // Mint quote premium to recipient to pay for nft
        TestERC20 quote = TestERC20(vm.envAddress("QUOTE_ADDRESS"));
        uint256 amountToGive = 10 * (10 ** 6);
        quote.mint(recipient, amountToGive);

        OptionNFT nft = OptionNFT(vm.envAddress("OPTION_NFT_ADDRESS")); 
        LimitOrderProtocol limitOrderProtocol = LimitOrderProtocol(payable(vm.envAddress("LIMIT_ORDER_PROTOCOL"))); // replace with actual deployed address

        uint256 optionId = 1; // The ID of the option NFT to check

        address currentOwner = nft.ownerOf(optionId);
        vm.stopBroadcast();
        console.log("Current NFT owner:", currentOwner);
        console.log("Expected NFT holder:", recipient);
        require(currentOwner == nftHolder, "NFT holder does not own the NFT");
        console.log(" NFT holder correctly owns the NFT!");

        // Transfer the NFT to another address using lop
        vm.startBroadcast(nftHolderKey);
        nft.approve(address(limitOrderProtocol), optionId);
        vm.stopBroadcast();

        // Build a simple order to transfer the NFT for a small amount of quote token
        uint256 price = 1 * (10 ** 6); // 1 quote token
        vm.startBroadcast(recipientKey);
        quote.approve(address(limitOrderProtocol), price);
        vm.stopBroadcast();
        vm.startBroadcast(recipientKey);
        IOrderMixin.Order memory order = IOrderMixin.Order({
            salt: block.timestamp,
            maker: Address.wrap(uint256(uint160(nftHolder))),
            receiver: Address.wrap(uint256(uint160(recipient))),
            makerAsset: Address.wrap(uint256(uint160(address(nft)))),
            takerAsset: Address.wrap(uint256(uint160(address(quote)))),
            makingAmount: 1, // 1 NFT
            takingAmount: price,
            makerTraits: MakerTraits.wrap(1 << 255) // Allow NFT transfer
        });
        bytes32 orderHash = limitOrderProtocol.hashOrder(order);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(nftHolderKey, orderHash);
        bytes32 vs = bytes32(uint256(s) | (uint256(v - 27) << 255));
        TakerTraits takerTraits = TakerTraits.wrap(1 << 255 | 1 << 251); // Allow NFT purchase
        bytes memory args = abi.encodePacked(address(recipient), bytes("")); // No extension
        (uint256 makingAmount, uint256 takingAmount, bytes32 finalOrderHash) =
            limitOrderProtocol.fillOrderArgs(order, r, vs, price, takerTraits, args);
        console.log("Order hash for NFT transfer:");
        console.logBytes32(finalOrderHash);

        // Check final nft owner
        address newOwner = nft.ownerOf(optionId);
        require(newOwner == recipient, "Recipient should own the NFT after transfer");
        console.log(" NFT successfully transferred to recipient!");
        vm.stopBroadcast();
    }
}
