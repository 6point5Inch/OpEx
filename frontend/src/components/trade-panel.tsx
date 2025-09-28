"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectedOption, OptionSide } from "@/types/options";
import { getWebSocketManager, OptionUpdate } from "@/utils/websocket";
import { Wifi, WifiOff } from "lucide-react";
import { limitOrderProtocolAbi } from "@/abi/lopabi";


interface TradePanelProps {
  selectedOption: SelectedOption | null;
}

declare global {
    interface Window {
        rabby?: any;
        ethereum?: any;
    }
}

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



export function TradePanel({ selectedOption }: TradePanelProps, livePrice: number ) {
  const [side, setSide] = useState<OptionSide>("buy");
  const [contracts, setContracts] = useState<string>("1");
  const [realtimeOptionData, setRealtimeOptionData] =
    useState<SelectedOption | null>(selectedOption);
  const [isOptionConnected, setIsOptionConnected] = useState<boolean>(false);

   const [addresses] = useState<ContractAddresses>({
        limitOrderProtocol: "0xEA4C65C75debD5Ce0F87BdDE8d55a0a57aC43088",
        nft: "0x87C83A6835041016f9aE67eB6cA690Cd718C6B03",
        engine: "0xBBaf795Af286b56f5255E75c1271aD9a437fFf22",
        hook: "0x5fcf14BfDc1643CDc4e6e1103A4D402A279Aa2C2",
        underlyingToken: "0xb0f495A5156a162dE68F1ca4F1b2bb1Dbc6b935E",
        quoteToken: "0xFADeBc92aEAb2E5C076081489Ec6671bA290843d"
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

  useEffect(() => {
    setRealtimeOptionData(selectedOption);
    if (!selectedOption?.instrumentName) return;

    const wsManager = getWebSocketManager();

    const handleOptionUpdate = (update: OptionUpdate) => {
      if (update.data.instrument_name === selectedOption.instrumentName) {
        setRealtimeOptionData((prev) => {
          if (!prev) return null;
          const newHestonPrice = update.data.heston_price;
          const newData = {
            ...prev.data,
            bid: newHestonPrice || -69,
            mark: newHestonPrice || -69,
            ask: newHestonPrice ? newHestonPrice * 1.02 : -69,
          };
          return { ...prev, data: newData };
        });
      }
    };



    const handleConnect = () => setIsOptionConnected(true);
    const handleDisconnect = () => setIsOptionConnected(false);

    wsManager.setEventHandlers({
      onConnect: handleConnect,
      onDisconnect: handleDisconnect,
      onUpdate: handleOptionUpdate,
    });

    wsManager.subscribe(selectedOption.instrumentName);
    setIsOptionConnected(wsManager.isConnected());

    return () => {
      if (selectedOption.instrumentName) {
        wsManager.unsubscribe(selectedOption.instrumentName);
      }
    };
  }, [selectedOption]);


      const connectWallet = async () => {
        try {
            let provider;
            // if (!window.ethereum) {
            //     setStatus("MetaMask not found. Please install MetaMask.");
            //     return;
            // }
            if (window.rabby) {
  provider = window.rabby;
} else if (window.ethereum) {
  provider = window.ethereum; // fallback to MetaMask
}

            setLoading(true);
             provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            setWalletAddress(address);
            setIsConnected(true);
            setStatus(`Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
        } catch (error: any) {
            console.error("Connection error:", error);
            setStatus(`Connection failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

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
    const createOrder = async (customParams?: OptionParams) => {
        try {
            setLoading(true);
            setStatus("Creating order...");

            const { signer } = await getProviderAndSigner();
            const makerAddress = await signer.getAddress();
            approveunderlyingTokens();
            
            // Use custom params if provided, otherwise use current state
            const params = customParams || optionParams;
            
            if (!params.strike || !params.size || !params.expiry || !params.premium) {
                throw new Error("Please fill in all required fields");
            }

            // Parse option parameters
            const strike = ethers.parseUnits(params.strike, 6); 
            const size = ethers.parseEther(params.size);
            console.log("strike",strike);
            console.log("size",size);
            console.log(params);
            // const expiry =1759089317; 
            const expiry = params.expiry;
            
            const premium = ethers.parseUnits(params.premium, 6);
            // if (livePrice === null) {
            //     throw new Error("livePrice cannot be null");
            // }
            const collateralAmount = size; // For calls, collateral = size

            console.log("Parsed values:", { strike, size, expiry, premium, collateralAmount });

            // Build extension with pre and post interaction data
            const prePayload = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "address", "address", "address", "uint256", "uint256", "uint256", "bool", "uint256", "string"],
                [0, makerAddress, addresses.underlyingToken, addresses.quoteToken, strike, size, expiry, params.isCall, collateralAmount, params.metadataUri]
            );
            console.log("preayload", prePayload)

            const postPayload = ethers.solidityPacked(["address"], [addresses.engine]);
            console.log(postPayload);
            const extension = buildExtPrePost(
                addresses.hook,
                prePayload,
                addresses.hook,
                postPayload
            );

            const extensionHash = ethers.keccak256(extension);
            const salt = BigInt(extensionHash) & ((BigInt(1) << BigInt(160)) - BigInt(1));

            const makerTraits = (BigInt(1) << BigInt(254)) | (BigInt(1) << BigInt(252)) | (BigInt(1) << BigInt(251)) | (BigInt(1) << BigInt(249));

 
              const order = {
                salt: salt,
                maker: makerAddress.toLowerCase(),
                receiver: makerAddress.toLowerCase(),
                makerAsset: addresses.underlyingToken.toLowerCase(),
                takerAsset: addresses.quoteToken.toLowerCase(),
                makingAmount: BigInt(size),
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
            console.log("Extension:", extension);
            console.log("Extension HAsh", extensionHash);
            console.log("Signature:", signature);
            console.log({ order, extension, signature, orderHash });

              const updated_strike = ethers.parseUnits(strike.toString());

            const payload = { orderHash, maker: makerAddress, makerAsset: addresses.underlyingToken, takerAsset: addresses.quoteToken, makingAmount: size.toString(), takingAmount: premium.toString(), salt: salt.toString(), makerTraits: makerTraits.toString(), orderData: extension, optionStrike: strike.toString(), optionExpiry: expiry, optionType: params.isCall ? "call" : "put", optionPremium: premium.toString(), signature: signature, extensionData: extension, validAt: Math.floor(Date.now() / 1000) };
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
            option_strike: params.strike
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

            const extensionLength = (orders.extension_data.length - 2) / 2; // Remove 0x and convert to byte length
            const takerTraits = (BigInt(1) << BigInt(251)) | (BigInt(extensionLength) << BigInt(224));
            const args = ethers.solidityPacked(["address"], [addresses.engine]) + orders.extension_data.slice(2);
          
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
             const successfully = await fetch(`http://localhost:5080/api/orders?${queryParams.toString()}`, {
            method: "GET",
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

  const handleSellSubmit = async () => {
    if (!realtimeOptionData) return;
    console.log("Trade submitted:", {
      strikePrice: realtimeOptionData.strikePrice,
      optionType: realtimeOptionData.type,
      side,
      contracts: parseFloat(contracts),
      instrumentName: realtimeOptionData.instrumentName,
      prices: realtimeOptionData.data,
    });
    
    const updatedParams = {
      ...optionParams,
      strike: realtimeOptionData.strikePrice.toString(),
      size: contracts,
      premium: realtimeOptionData.data.mark.toString()
    };
    
    setOptionParams(updatedParams);
    
    // Pass the updated parameters directly to avoid state timing issues
    await createOrder(updatedParams);
    
    setContracts("1");
    setSide("buy");
  };
    const handleBuySubmit = async () => {
    if (!realtimeOptionData) return;
    console.log("Trade submitted:", {
      strikePrice: realtimeOptionData.strikePrice,
      optionType: realtimeOptionData.type,
      side,
      contracts: parseFloat(contracts),
      instrumentName: realtimeOptionData.instrumentName,
      prices: realtimeOptionData.data,
    });
    
    const updatedParams = {
      ...optionParams,
      strike: realtimeOptionData.strikePrice.toString(),
      size: contracts,
      premium: realtimeOptionData.data.mark.toString()
    };
    
    setOptionParams(updatedParams);
    
    // Pass the updated parameters directly to avoid state timing issues
    await fillOrder(updatedParams);
    
    setContracts("1");
    setSide("buy");
  };


  const formatNumber = (
    value: number | undefined,
    decimals: number = 2
  ): string => {
    if (value === undefined || value === -69) return "-";
    return value.toFixed(decimals);
  };

  const calculateTotalCost = (): number => {
    if (!realtimeOptionData) return 0;
    const { ask, bid } = realtimeOptionData.data;
    if (ask === -69 || bid === -69) return 0;
    const price = side === "buy" ? ask : bid;
    return price * parseFloat(contracts || "0");
  };

  if (!selectedOption || !realtimeOptionData) {
    return (
      <Card className="h-full flex items-center justify-center bg-muted/20">
        <div className="text-center text-muted-foreground">
          <p>Select an option to start trading.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between py-2 px-4 border-b">
        <CardTitle className="text-sm font-medium">Trade</CardTitle>
        <div className="flex items-center space-x-1">
          {isOptionConnected ? (
            <Wifi className="h-3 w-3 text-green-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-500" />
          )}
          <span
            className={`text-xs ${
              isOptionConnected ? "text-green-400" : "text-red-400"
            }`}
          >
            {isOptionConnected ? "Live" : "Offline"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Badge
              variant={
                selectedOption.type === "call" ? "default" : "destructive"
              }
            >
              {selectedOption.type.toUpperCase()}
            </Badge>
            <span className="text-lg font-semibold">
              ${formatNumber(realtimeOptionData.strikePrice, 6)}
            </span>
          </div>

          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mark:</span>
              <span className="font-semibold">
                ${formatNumber(realtimeOptionData.data.mark, 4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bid:</span>
              <span className="text-green-500 font-semibold">
                ${formatNumber(realtimeOptionData.data.bid, 4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ask:</span>
              <span className="text-red-500 font-semibold">
                ${formatNumber(realtimeOptionData.data.ask, 4)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">
              Contracts
            </label>
            <Input
              type="number"
              min="1"
              step="1"
              value={contracts}
              onChange={(e) => setContracts(e.target.value)}
              placeholder="1"
              className="bg-background"
            />
          </div>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Button
              onClick={() => {
                setSide("buy");
                handleBuySubmit();
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!contracts || realtimeOptionData.data.ask === -69}
            >
              Buy
            </Button>
            <Button
              onClick={() => {
                setSide("sell");
                handleSellSubmit();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!contracts || realtimeOptionData.data.bid === -69}
            >
              Sell
            </Button>
          </div>
          <div className="text-center text-xs text-muted-foreground mt-2">
            Est. Total: ${formatNumber(calculateTotalCost(), 4)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
