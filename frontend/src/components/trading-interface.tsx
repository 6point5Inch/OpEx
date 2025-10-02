"use client";

import React, { useState, useEffect } from "react";
import {ethers } from 'ethers'

import { useLivePrices } from "@/hooks/useLivePrices";
import { limitOrderProtocolAbi } from "@/abi/lopabi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ChevronDown, Info, RotateCcw } from "lucide-react";
import { count } from "console";

// Token configurations
const tokens = {
  "1inch": {
    symbol: "1inch",
    name: "1inch",
    icon: "◎",
    price: 11.56,
    change: "-3.29%",
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    icon: "Ξ",
    price: 3845.32,
    change: "-2.1%",
  },
};

interface TokenSelectorProps {
  selectedToken: string;
  onTokenSelect: (token: string) => void;
  label: string;
  amount: string;
  onAmountChange: (amount: string) => void;
  balance?: string;
}

function TokenSelector({
  selectedToken,
  onTokenSelect,
  label,
  amount,
  onAmountChange,
  balance,
}: TokenSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-stone-400">{label}</span>
        {balance && <span className="text-xs text-stone-500">{balance}</span>}
      </div>
      <div className="flex items-center space-x-3 rounded-lg bg-stone-800/50 p-4 border border-stone-700">
        <Select value={selectedToken} onValueChange={onTokenSelect}>
          <SelectTrigger className="w-32 border-0 bg-stone-700 text-white">
            <SelectValue>
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {tokens[selectedToken as keyof typeof tokens]?.icon}
                </span>
                <span>{selectedToken}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-stone-800 border-stone-700">
            {Object.entries(tokens).map(([symbol, token]) => (
              <SelectItem
                key={`select-${symbol}`}
                value={symbol}
                className="text-white hover:bg-stone-700"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{token.icon}</span>
                  <span>{symbol}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1 text-right">
          <Input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0.00"
            className="border-0 bg-transparent text-right text-2xl font-medium text-white placeholder:text-stone-500 focus-visible:ring-0"
          />
          {/* <div className="text-xs text-stone-500 mt-1">
            $
            {(
              parseFloat(amount || "0") *
                tokens[selectedToken as keyof typeof tokens]?.price || 0
            ).toFixed(2)}
          </div> */}
        </div>
      </div>

      {/* <div className="flex justify-end space-x-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-stone-400 hover:text-white hover:bg-stone-800"
          onClick={() =>
            onAmountChange(
              (parseFloat(balance?.split(" ")[0] || "0") * 0.5).toString()
            )
          }
        >
          HALF
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-stone-400 hover:text-white hover:bg-stone-800"
          onClick={() => onAmountChange(balance?.split(" ")[0] || "0")}
        >
          MAX
        </Button>
      </div> */}
    </div>
  );
}

function MarketOrderForm() {
  const [sellingToken, setSellingToken] = useState("1inch");
  const [buyingToken, setBuyingToken] = useState("ETH");
  const [sellingAmount, setSellingAmount] = useState("0.629200147");
  const [buyingAmount, setBuyingAmount] = useState("122.860788");

  const handleSwap = () => {
    const tempToken = sellingToken;
    setSellingToken(buyingToken);
    setBuyingToken(tempToken);

    const tempAmount = sellingAmount;
    setSellingAmount(buyingAmount);
    setBuyingAmount(tempAmount);
  };

  const rate = tokens[sellingToken as keyof typeof tokens]?.price || 0;
  const currentRate = `1 ${sellingToken} = ${rate.toFixed(2)} ${buyingToken}`;

  return (
    <div className="space-y-6">
      {/* Ultra V2 Badge */}
      <div className="flex items-center justify-between">
        <Badge
          variant="secondary"
          className="bg-lime-600 text-black font-medium"
        >
          Ultra V2
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-stone-400 hover:text-white"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Selling Token */}
      <TokenSelector
        selectedToken={sellingToken}
        onTokenSelect={setSellingToken}
        label="Selling"
        amount={sellingAmount}
        onAmountChange={setSellingAmount}
        balance={`0.00 ${sellingToken}`}
      />

      {/* Swap Button */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-600"
          onClick={handleSwap}
        >
          <ArrowUpDown className="h-4 w-4 text-stone-400" />
        </Button>
      </div>

      {/* Buying Token */}
      <TokenSelector
        selectedToken={buyingToken}
        onTokenSelect={setBuyingToken}
        label="Buying"
        amount={buyingAmount}
        onAmountChange={setBuyingAmount}
        balance={`0.00 ${buyingToken}`}
      />

      {/* Submit Button */}
      <Button className="w-full h-12 bg-lime-600 hover:bg-lime-500 text-black font-medium" >
        Insufficient Token
      </Button>

      {/* Rate Info */}
      <div className="flex items-center justify-between text-sm bg-stone-800/30 rounded-lg p-3 border border-stone-700">
        <span className="text-stone-400">{currentRate}</span>
        <div className="flex items-center space-x-2">
          <span className="text-stone-400">0.02% FEE</span>
          <ChevronDown className="h-3 w-3 text-stone-500" />
        </div>
      </div>
    </div>
  );
}

function TriggerOrderForm() {
  const [sellingToken, setSellingToken] = useState("1inch");
  const [buyingToken, setBuyingToken] = useState("ETH");
  const [sellingAmount, setSellingAmount] = useState("5");
  const [buyingAmount, setBuyingAmount] = useState("0.02547617");
  const [buyRate, setBuyRate] = useState("196.261839986");
  const [expiry, setExpiry] = useState("Never");

  const handleSwap = () => {
    // Swap tokens
    const tempToken = sellingToken;
    setSellingToken(buyingToken);
    setBuyingToken(tempToken);

    // Swap amounts
    const tempAmount = sellingAmount;
    setSellingAmount(buyingAmount);
    setBuyingAmount(tempAmount);
  };

  return (
    <div className="space-y-6">
      {/* Selling Token */}
      <TokenSelector
        selectedToken={sellingToken}
        onTokenSelect={setSellingToken}
        label="Selling"
        amount={sellingAmount}
        onAmountChange={setSellingAmount}
        balance={`0.00 ${sellingToken}`}
      />

      {/* Swap Button */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-600"
          onClick={handleSwap}
        >
          <ArrowUpDown className="h-4 w-4 text-stone-400" />
        </Button>
      </div>

      {/* Buying Token */}
      <TokenSelector
        selectedToken={buyingToken}
        onTokenSelect={setBuyingToken}
        label="Buying"
        amount={buyingAmount}
        onAmountChange={setBuyingAmount}
        balance={`0.00 ${buyingToken}`}
      />

      {/* Buy Rate and Expiry */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <span className="text-sm text-stone-400">
            Buy {buyingToken} at rate
          </span>
          <div className="rounded-lg bg-stone-800/50 p-4 border border-stone-700">
            <Input
              value={buyRate}
              onChange={(e) => setBuyRate(e.target.value)}
              className="border-0 bg-transparent text-white text-lg font-medium focus-visible:ring-0"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-stone-500">Use Market</span>
              <span className="text-xs text-stone-400">1inch</span>
            </div>
            <div className="text-xs text-stone-500">≈ ${buyRate}</div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm text-stone-400">Expiry</span>
          <div className="rounded-lg bg-stone-800/50 p-4 border border-stone-700">
            <Select value={expiry} onValueChange={setExpiry}>
              <SelectTrigger className="border-0 bg-transparent text-white text-lg font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-stone-800 border-stone-700">
                <SelectItem
                  value="Never"
                  className="text-white hover:bg-stone-700"
                >
                  Never
                </SelectItem>
                <SelectItem
                  value="1hour"
                  className="text-white hover:bg-stone-700"
                >
                  1 Hour
                </SelectItem>
                <SelectItem
                  value="1day"
                  className="text-white hover:bg-stone-700"
                >
                  1 Day
                </SelectItem>
                <SelectItem
                  value="1week"
                  className="text-white hover:bg-stone-700"
                >
                  1 Week
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button className="w-full h-12 bg-stone-600 hover:bg-stone-500 text-white font-medium" >
        Insufficient Token
      </Button>

      {/* Ultra Mode Info */}
      <div className="text-xs text-stone-500">
        Ultra Mode: You will receive at least {buyingAmount} {buyingToken},
        minus platform fees.{" "}
        <span className="text-stone-400 underline cursor-pointer">
          Learn more
        </span>
      </div>

      {/* Trigger Summary */}
      <Card className="bg-stone-800/30 border-stone-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-stone-400">Trigger Summary</span>
            <ChevronDown className="h-4 w-4 text-stone-400" />
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-400">Sell Order</span>
              <span className="text-white">
                {sellingAmount} {sellingToken}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">To Buy</span>
              <span className="text-white">
                {buyingAmount} {buyingToken}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Buy {buyingToken} at Rate</span>
              <span className="text-white">
                {buyRate} {sellingToken}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Expiry</span>
              <span className="text-white">{expiry}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Platform Fee</span>
              <span className="text-lime-400">0.10%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
  declare global {
    interface Window {
        rabby?: any;
        ethereum?: any;
    }
}

function RecurringOrderForm() {
  const [allocateToken, setAllocateToken] = useState("1inch");
  const [buyToken, setBuyToken] = useState("ETH");
  const [allocateAmount, setAllocateAmount] = useState("120");
  const [frequency, setFrequency] = useState("1");
  const [period, setPeriod] = useState("minute");
  const [orderCount, setOrderCount] = useState("2");

  // Live prices hook
  const {
    prices: livePrices,
    isLoading: pricesLoading,
    error: pricesError,
    lastUpdated: pricesLastUpdated,
    refetch: refetchPrices,
    getPrice,
  } = useLivePrices(true, 5000);

  // Calculate gap in seconds based on frequency and period
  const gap = (() => {
    const freq = parseInt(frequency);
    switch (period) {
      case "minute":
        return freq * 60;
      case "hour":
        return freq * 60 * 60;
      case "day":
        return freq * 60 * 60 * 24;
      case "week":
        return freq * 60 * 60 * 24 * 7;
      default:
        return freq * 60; // default to minutes
    }
  })();




interface OptionParams {
    strike: string;
    size: string;
    expiry: string;
    isCall: boolean;
    premium: string;
    underlyingToken: string;
    quoteToken: string;
    metadataUri: string;
}

interface ContractAddresses {
    limitOrderProtocol: string;
    nft: string;
    engine: string;
    hook: string;
    underlyingToken: string;
    quoteToken: string;
}

const [addresses] = useState<ContractAddresses>({
        limitOrderProtocol: process.env.NEXT_PUBLIC_LIMIT_ORDER_PROTOCOL_ADDRESS || "0xEA4C65C75debD5Ce0F87BdDE8d55a0a57aC43088",
        nft: process.env.NEXT_PUBLIC_NFT_ADDRESS || "0x87C83A6835041016f9aE67eB6cA690Cd718C6B03",
        engine: process.env.NEXT_PUBLIC_ENGINE_ADDRESS || "0xBBaf795Af286b56f5255E75c1271aD9a437fFf22",
        hook: process.env.NEXT_PUBLIC_HOOK_ADDRESS || "0x5fcf14BfDc1643CDc4e6e1103A4D402A279Aa2C2",
        underlyingToken: process.env.NEXT_PUBLIC_UNDERLYING_TOKEN_ADDRESS || "0xb0f495A5156a162dE68F1ca4F1b2bb1Dbc6b935E",
        quoteToken: process.env.NEXT_PUBLIC_QUOTE_TOKEN_ADDRESS || "0xFADeBc92aEAb2E5C076081489Ec6671bA290843d"
    });

    // Option parameters state
    const [optionParams, setOptionParams] = useState<OptionParams>({
        strike: "100",
        size: "1",
        expiry: (Math.floor(Date.now() / 1000) +7*24*60*60).toString(),
        isCall: true,
        premium: "5",
        underlyingToken: "",
        quoteToken: "",
        metadataUri: "option-metadata-uri"
    });

   
    const [walletAddress, setWalletAddress] = useState<string>("");
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [status, setStatus] = useState<string>("");



    // Basic ERC20 ABI for token operations
    const erc20Abi = [
        "function balanceOf(address owner) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function mint(address to, uint256 amount)"
    ];

 
      // Get provider and signer
    const getProviderAndSigner = async () => {
        if (!window.ethereum) throw new Error("No wallet provider found");
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return { provider, signer };
    };

    // Build extension data (port of Solidity _buildExtPrePost function)
    const buildExtPrePost = (
        preAddress: string,
        prePayload: string,
        postAddress: string,
        postPayload: string
    ): any => {
        const preField = preAddress === ethers.ZeroAddress ? "0x" : preAddress.slice(2) + prePayload.slice(2);
        const postField = postAddress === ethers.ZeroAddress ? "0x" : postAddress.slice(2) + postPayload.slice(2);
        console.log("prefeild", preField);
        console.log("postFeild", postField);
        
        let len0: number = 0;
let len1: number = 0;
let len2: number = 0;
let len3: number = 0;
let len4: number = 0;
let len5: number = 0;
let len6: number = preField.length/2; // assuming preField is a bytes array or string
let len7: number = (preField.length + postField.length)/2; // assuming postField is a bytes array or string

let offsets: bigint = 0n;
offsets |= BigInt(len0);
offsets |= BigInt(len1) << 32n;
offsets |= BigInt(len2) << 64n;
offsets |= BigInt(len3) << 96n;
offsets |= BigInt(len4) << 128n;
offsets |= BigInt(len5) << 160n;
offsets |= BigInt(len6) << 192n;
offsets |= BigInt(len7) << 224n;

  const offsetsPacked = ethers.zeroPadValue(ethers.toBeHex(offsets), 32);
    const result = ethers.concat([
        offsetsPacked,
        ethers.getBytes("0x" + preField),
        ethers.getBytes("0x" + postField)
    ]);
    
    return ethers.hexlify(result);        
    };

    //Approve Underlying Token to LOP and EngineContract to avoid allowance revert 
       const approveunderlyingTokens = async () => {
        try {
            setLoading(true);
            setStatus("Approving tokens...");

            const { signer } = await getProviderAndSigner();
            const underlyingContract = new ethers.Contract(addresses.underlyingToken, erc20Abi, signer);
            const quoteContract = new ethers.Contract(addresses.quoteToken, erc20Abi, signer);

            const size = ethers.parseEther(optionParams.size);
            const premium = ethers.parseUnits(optionParams.premium, 6); // Assuming USDC decimals

            await (await underlyingContract.approve(addresses.engine, size)).wait();
            await (await underlyingContract.approve(addresses.limitOrderProtocol, size)).wait();

            setStatus("Tokens approved successfully!");
        } catch (error: any) {
            console.error("Approval error:", error);
            setStatus(`Approval failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    //Approve Quote token to LOP to avoid allowance revert
       const approvequoteTokens = async () => {
        try {
            setLoading(true);
            setStatus("Approving tokens...");

            const { signer } = await getProviderAndSigner();
            const underlyingContract = new ethers.Contract(addresses.underlyingToken, erc20Abi, signer);
            const quoteContract = new ethers.Contract(addresses.quoteToken, erc20Abi, signer);

            const size = ethers.parseEther(optionParams.size);
            const premium = ethers.parseUnits(optionParams.premium, 6); // Assuming USDC decimals

          
            await (await quoteContract.approve(addresses.limitOrderProtocol, premium)).wait();

            setStatus("Tokens approved successfully!");
        } catch (error: any) {
            console.error("Approval error:", error);
            setStatus(`Approval failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

//To sign order with the maker
    async function signOrder(
  order: any, 
  signer: ethers.Signer, 
  lopAddress: string, 
  originalAddresses: any
) {
  const domain = {
    name: "1inch Limit Order Protocol",
    version: "4",
    chainId: await signer.provider!.getNetwork().then(n => n.chainId),
    verifyingContract: lopAddress
  };

  const types = {
    Order: [
      { name: "salt", type: "uint256" },
      { name: "maker", type: "address" },
      { name: "receiver", type: "address" },
      { name: "makerAsset", type: "address" },
      { name: "takerAsset", type: "address" },
      { name: "makingAmount", type: "uint256" },
      { name: "takingAmount", type: "uint256" },
      { name: "makerTraits", type: "uint256" }
    ]
  };

  const value = {
    salt: order.salt,
    maker: originalAddresses.maker,
    receiver: originalAddresses.receiver,
    makerAsset: originalAddresses.makerAsset,
    takerAsset: originalAddresses.takerAsset,
    makingAmount: order.makingAmount,
    takingAmount: order.takingAmount,
    makerTraits: order.makerTraits
  };
  const signature = await signer.signTypedData(domain, types, value);
  return signature;
  
}

    // Create and sign order (maker side)
    const createOrder = async ( i: number) => {
        try {
            setLoading(true);
            setStatus("Creating order...");

            const { signer } = await getProviderAndSigner();
            const makerAddress = await signer.getAddress();
            await approveunderlyingTokens();
            
            // Use custom params if provided, otherwise use current state
            const params = optionParams;
            

            
            const premium = ethers.parseUnits(params.premium, 6);
            // if (livePrice === null) {
            //     throw new Error("livePrice cannot be null");
            // }
            const makeramount = ethers.parseUnits(allocateAmount,6) ;
            const collateralAmount = makeramount / BigInt(orderCount);
            
            // For calls, collateral = size

            // Build extension with pre and post interaction data
            // const prePayload = ethers.AbiCoder.defaultAbiCoder().encode(
            //     ["uint256", "address", "address", "address", "uint256", "uint256", "uint256", "bool", "uint256", "string"],
            //     [0, makerAddress, addresses.underlyingToken, addresses.quoteToken, strike, size, expiry, params.isCall, collateralAmount, params.metadataUri]
            // );
            // console.log("preayload", prePayload)

            // const postPayload = ethers.solidityPacked(["address"], [addresses.engine]);
            // console.log(postPayload);
            // const extension = buildExtPrePost(
            //     addresses.hook,
            //     prePayload,
            //     addresses.hook,
            //     postPayload
            // );

            // const extensionHash = ethers.keccak256(extension);
            const salt = BigInt(Math.floor(Date.now()));

            const makerTraits = (BigInt(1) << BigInt(255));
 
              const order = {
                salt: salt,
                maker: makerAddress.toLowerCase(),
                receiver: makerAddress.toLowerCase(),
                makerAsset: addresses.underlyingToken.toLowerCase(),
                takerAsset: addresses.quoteToken.toLowerCase(),
                makingAmount: BigInt(collateralAmount),
                takingAmount: BigInt(premium),
                makerTraits: makerTraits
            };
            
            const ordertuple = [
                order.salt,
                order.maker,
                order.receiver,
                order.makerAsset,
                order.takerAsset,
                order.makingAmount,
                order.takingAmount,
                order.makerTraits
            ];

            const orderHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "address", "address", "address", "address", "uint256", "uint256", "uint256"],
                ordertuple
            ));
                            const originalAddresses = {
                    maker: makerAddress,
                    receiver: makerAddress,
                    makerAsset: addresses.underlyingToken,
                    takerAsset: addresses.quoteToken
                };
            const signature = await signOrder(order, signer, addresses.limitOrderProtocol, originalAddresses);  

            setStatus(`Order created and signed! Hash: ${orderHash.slice(0, 10)}...`);
            console.log("Order:", order);
            console.log("Signature:", signature);
            console.log({ order, signature, orderHash });
                const size = premium;
            const payload = { orderHash, maker: makerAddress, makerAsset: addresses.underlyingToken, takerAsset: addresses.quoteToken, makingAmount: size.toString(), takingAmount: premium.toString(), salt: salt.toString(), makerTraits: makerTraits.toString(), optionType: "recurring", optionPremium: premium.toString(), signature: signature,  validAt: Math.floor(Date.now() / 1000 ) + i*gap };
            const response = await fetch("http://localhost:5080/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Failed to save order");
            console.log(result);
            return result;
        } catch (error: any) {
            console.error("Order creation error:", error);
            setStatus(`Order creation failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };


    function buildOrderTuple(order: any): string[] {
  return [
    order.salt.toString(),
    order.maker.toString(),
    order.receiver.toString(),
    order.makerAsset.toString(),
    order.takerAsset.toString(),
    order.makingAmount.toString(),
    order.takingAmount.toString(),
    order.makerTraits.toString()
  ];
}
function buildSignatureComponents(signature: any): { r: string; vs: string } {
  let sig;
  
  if (typeof signature === 'string') {
    sig = ethers.Signature.from(signature);
  } else if (signature.r && signature.s && signature.v !== undefined) {
    sig = signature;
  } else {
    throw new Error("Invalid signature format - missing r, s, v properties");
  }
  
  console.log("Signature components:", { r: sig.r, s: sig.s, v: sig.v });
  
  const r = sig.r;
  let vsBigInt = BigInt(sig.s);
  
  // Apply EIP-2098 compact signature format
  if (sig.v === 28) {
    vsBigInt |= (BigInt(1) << BigInt(255));
  }
  
  const vs = ethers.zeroPadValue(ethers.toBeHex(vsBigInt), 32);
  
  return { r, vs };
}


    // Fill order (taker side)
    const fillOrder = async (customParams?: OptionParams) => {
        try {
            setLoading(true);
            setStatus("Filling order...");
            await approvequoteTokens();
            
            // Use custom params if provided, otherwise use current state
            const params = customParams || optionParams;
            
           const queryParams = new URLSearchParams({
            status: "open",
            limit: "50",
            makerAsset: addresses.underlyingToken, 
            takerAsset: addresses.quoteToken,
            StrikePrice: params.strike
        });

        const response = await fetch(`http://localhost:5080/api/orders?${queryParams.toString()}`, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || "Failed to fetch orders");
        }
            const { signer } = await getProviderAndSigner();
            console.log("Fetched order data:", result);
           
            const orders = result[0];

             const order = {
                salt: orders.salt,
                maker: orders.maker.toLowerCase(),
                receiver: orders.maker.toLowerCase(),
                makerAsset: addresses.underlyingToken.toLowerCase(),
                takerAsset: addresses.quoteToken.toLowerCase(),
                makingAmount: orders.making_amount,
                takingAmount: orders.taking_amount,
                makerTraits: orders.maker_traits
            };
               

            let signature;
            try {
                console.log("Raw signature:", orders.signature, "Type:", typeof orders.signature);
                
                if (typeof orders.signature === 'string') {
                    try {
                        signature = JSON.parse(orders.signature);
                    } catch (parseError) {
                        console.log("JSON parse failed, treating as direct signature:", parseError);
                        try {
                            signature = ethers.Signature.from(orders.signature);
                        } catch (ethersError) {
                            console.error("Failed to parse as ethers signature:", ethersError);
                            throw new Error("Invalid signature format - not JSON and not valid signature string");
                        }
                    }
                } else {
                    signature = orders.signature;
                }
                
                console.log("Processed signature:", signature);
            } catch (error) {
                console.error("Signature processing error:", error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                throw new Error(`Invalid signature format: ${errorMessage}`);
            }
            
            const { r, vs } = buildSignatureComponents(signature);

            // const extensionLength = (orders.extension_data.length - 2) / 2; // Remove 0x and convert to byte length
            const takerTraits = (BigInt(1) << BigInt(251)); 
            const args = ethers.solidityPacked(["address"], [addresses.engine]) ;
          
             const orderTuple = buildOrderTuple(order);

          
            console.log("Fill parameters:", orderTuple);

            const limitOrderContract = new ethers.Contract(addresses.limitOrderProtocol, limitOrderProtocolAbi.abi, signer);
            
            const tx = await limitOrderContract.fillOrderArgs(
                orderTuple, 
                r,
                vs,
                BigInt(orders.taking_amount), 
                takerTraits,
                args
            );

            const receipt = await tx.wait();
            setStatus(`Order filled successfully! Block: ${receipt.blockNumber}`);
             const successfully = await fetch(`http://localhost:5080/api/orders?${orders.order_hash}/close`, {
            method: "POST",
            headers: {
                "Accept": "application/json"
            }
        });
            return receipt;
        } catch (error: any) {
            console.error("Order fill error:", error);
            setStatus(`Order fill failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

  const handleSwap = () => {
    // Swap tokens
    const tempToken = allocateToken;
    setAllocateToken(buyToken);
    setBuyToken(tempToken);

    // Note: For recurring orders, we don't swap amounts as it's allocation-based
  };
  const placeorder = async () => {
    let i;
    const price = getPrice("ETH");
    
    // Update option params with live price
    if (price !== null) {
      setOptionParams(prev => ({
        ...prev,
        premium: price.toFixed(2)
      }));
    }
    
    for (i = 0; i < parseInt(orderCount); i++) {
      createOrder(i);
    }
  }

  return (
    <div className="space-y-6">
      {/* I Want To Allocate */}
      <TokenSelector
        selectedToken={allocateToken}
        onTokenSelect={setAllocateToken}
        label="I Want To Allocate"
        amount={allocateAmount}
        onAmountChange={setAllocateAmount}
        balance={`0.00 ${allocateToken}`}
      />

      {/* Swap Arrow */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-600"
          onClick={handleSwap}
        >
          <ArrowUpDown className="h-4 w-4 text-stone-400" />
        </Button>
      </div>

      {/* To Buy */}
      <TokenSelector
        selectedToken={buyToken}
        onTokenSelect={setBuyToken}
        label="To Buy"
        amount="0.00"
        onAmountChange={() => {}}
        balance={`0.00 ${buyToken}`}
      />

      {/* Frequency Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <span className="text-sm text-stone-400">Every</span>
          <div className="flex items-center space-x-2">
            <Input
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="bg-stone-800/50 border-stone-700 text-white h-12 text-center"
            />
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="bg-stone-800/50 border-stone-700 text-white h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-stone-800 border-stone-700">
                <SelectItem
                  value="minute"
                  className="text-white hover:bg-stone-700"
                >
                  minute
                </SelectItem>
                <SelectItem
                  value="hour"
                  className="text-white hover:bg-stone-700"
                >
                  hour
                </SelectItem>
                <SelectItem
                  value="day"
                  className="text-white hover:bg-stone-700"
                >
                  day
                </SelectItem>
                <SelectItem
                  value="week"
                  className="text-white hover:bg-stone-700"
                >
                  week
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-1">
            <span className="text-sm text-stone-400">Over</span>
            <Info className="h-3 w-3 text-stone-500" />
          </div>
          <div className="flex items-center space-x-2">
            <Input
              value={orderCount}
              onChange={(e) => setOrderCount(e.target.value)}
              className="bg-stone-800/50 border-stone-700 text-white h-12 text-center"
            />
            <span className="text-stone-400 text-sm whitespace-nowrap">
              orders
            </span>
          </div>
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <span className="text-sm text-stone-400">
              Price Range (optional)
            </span>
            <Info className="h-3 w-3 text-stone-500" />
          </div>
          <span className="text-xs text-stone-500">
            Rate: 196.3 1inch / ETH
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Min Price"
            className="bg-stone-800/50 border-stone-700 text-white placeholder:text-stone-500"
          />
          <span className="text-stone-500">-</span>
          <Input
            placeholder="Max Price"
            className="bg-stone-800/50 border-stone-700 text-white placeholder:text-stone-500"
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button className="w-full h-12 bg-stone-600 hover:bg-stone-500 text-white font-medium" onClick={placeorder}>
      Place Order</Button>

      {/* Recurring Summary */}
      <Card className="bg-stone-800/30 border-stone-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-stone-400">Recurring Summary</span>
            <ChevronDown className="h-4 w-4 text-stone-400" />
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-400">Sell total</span>
              <span className="text-white">
                {allocateAmount} {allocateToken}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Sell per order</span>
              <span className="text-white">
                {(parseFloat(allocateAmount) / parseFloat(orderCount)).toFixed(
                  0
                )}{" "}
                {allocateToken}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">To buy</span>
              <span className="text-white">{buyToken}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Order interval</span>
              <span className="text-white">
                {frequency} {period}(s)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Estimated end date</span>
              <span className="text-white">26 Sep 2025 18:27</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Platform fee</span>
              <span className="text-lime-400">0.1%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function TradingInterface() {
  const [activeTab, setActiveTab] = useState("market");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-stone-950 p-4">
        <div className="mx-auto max-w-md">
          <div className="animate-pulse">
            <div className="h-12 bg-stone-800 rounded-lg mb-6"></div>
            <div className="space-y-4">
              <div className="h-20 bg-stone-800 rounded-lg"></div>
              <div className="h-20 bg-stone-800 rounded-lg"></div>
              <div className="h-12 bg-stone-800 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 p-4">
      <div className="mx-auto max-w-md">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-stone-900 border border-stone-800">
            <TabsTrigger
              value="market"
              className="text-stone-400 data-[state=active]:bg-lime-600 data-[state=active]:text-black font-medium"
            >
              Market
            </TabsTrigger>
            <TabsTrigger
              value="trigger"
              className="text-stone-400 data-[state=active]:bg-stone-800 data-[state=active]:text-white"
            >
              Trigger
            </TabsTrigger>
            <TabsTrigger
              value="recurring"
              className="text-stone-400 data-[state=active]:bg-stone-800 data-[state=active]:text-white"
            >
              Recurring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="market" className="mt-0">
            <MarketOrderForm />
          </TabsContent>

          <TabsContent value="trigger" className="mt-0">
            <TriggerOrderForm />
          </TabsContent>

          <TabsContent value="recurring" className="mt-0">
            <RecurringOrderForm />
          </TabsContent>
        </Tabs>

        {/* Token Prices Footer */}
        <div className="mt-8 space-y-3">
          {Object.entries(tokens).map(([symbol, token]) => (
            <div
              key={`price-${symbol}`}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{token.icon}</span>
                <div>
                  <div className="text-white font-medium">{symbol}</div>
                  <div className="text-xs text-stone-500">{token.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white">${token.price}</div>
                <div
                  className={`text-xs ${
                    token.change.startsWith("-")
                      ? "text-red-400"
                      : "text-lime-400"
                  }`}
                >
                  {token.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Open Swap Page */}
        <Button
          variant="ghost"
          className="w-full mt-6 text-stone-400 hover:text-white hover:bg-stone-800 justify-between"
        >
          <span>Open Swap page</span>
          <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
        </Button>
      </div>
    </div>
  );
}
