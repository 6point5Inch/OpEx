# OpEx

A decentralized options trading protocol built on top of the 1inch Limit Order Protocol, enabling efficient on-chain options trading with NFT-based position representation.

## 🎯 Overview

OpEx combines the power of 1inch's limit order infrastructure with a sophisticated options engine to create a seamless DeFi options trading experience. The protocol uses NFTs to represent option positions that support a dynamic premium pricing using the Heston model.

### Key Features

- **📊 Options Trading**: Create and trade call/put options with customizable strike prices and expiration dates
- **🎫 NFT Positions**: Each option position is represented as an ERC-721 NFT for easy transferability
- **🔄 1inch Integration**: Leverage 1inch's battle-tested limit order protocol for efficient order matching
- **🎨 Frontend Interface**: Modern React-based UI for seamless user interaction

## 🏗️ Architecture

The protocol consists of several interconnected components:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   Smart         │
│   (Next.js)     │◄──►│   (Python)       │◄──►│   Contracts     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                               ┌────────────────────────┼────────────────────────┐
                               │                        │                        │
                    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
                    │  Option Engine  │    │   Option Hook   │    │   Option NFT    │
                    └─────────────────┘    └─────────────────┘    └─────────────────┘
                               │                        │                        │
                               └────────────────────────┼────────────────────────┘
                                                        │
                                              ┌─────────────────┐
                                              │ 1inch Limit     │
                                              │ Order Protocol  │
                                              └─────────────────┘
```

### Core Components

- **OptionEngine**: Core logic for option creation, exercise, and settlement
- **OptionHook**: Pre/post interaction hooks for the 1inch limit order protocol
- **OptionNFT**: ERC-721 implementation representing option positions
- **LimitOrderProtocol**: Custom implementation of 1inch's limit order system

## 🚀 Quick Start

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/6-5-Inch/main-asla.git
   cd main-asla
   ```

2. **Install dependencies**

   **Smart Contracts:**
   ```bash
   cd contracts
   forge install OpenZeppelin/openzeppelin-contracts 
   forge install 1inch/limit-order-protocol
   forge install 1inch/solidity-utils
   ```

   **Frontend:**
   ```bash
   cd frontend
   npm install
   # or
   yarn install
   ```

   **Python Backend:**
   ```bash
   cd twap
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Environment Setup**
   
   Copy the example environment files and fill in your configuration:
   ```bash
   cp contracts/.env.example contracts/.env
   ```

### Configuration

#### Smart Contracts (.env)
```env
MAKER_KEY=your_private_key_here
BUYER_KEY=another_private_key_here
UNDERLYING_ADDRESS=0x...  # ERC20 token address
QUOTE_ADDRESS=0x...       # Quote token address
OPTION_NFT_ADDRESS=0x...  # Deployed NFT contract
ENGINE_CONTRACT=0x...     # Option engine contract
HOOK_CONTRACT=0x...       # Hook contract
LIMIT_ORDER_PROTOCOL=0x...# Limit order protocol
```

### Frontend Development

1. **Start development server**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Build for production**
   ```bash
   npm run build
   ```

### Python Backend

1. **Run TWAP calculations**
   ```bash
   cd twap
   python twap.py
   ```

2. **Run option pricing**
   ```bash
   python option.py
   ```

## 📖 Usage

### Creating Options

1. **Connect Wallet**: Connect your Web3 wallet to the frontend
2. **Select Parameters**: Choose underlying asset, strike price, expiration, and option type
4. **Create Order**: Submit the option creation transaction

### Trading Options

1. **Browse Options**: View available options in the marketplace
2. **Select Option**: Choose an option that matches your trading strategy  
3. **Execute Trade**: Purchase the option by matching the limit order
4. **Exercise**: Exercise your option before expiration if profitable

## 🌐 Deployment

### Testnet Deployment

1. **Configure network**
   ```bash
   # Add network configuration to foundry.toml
   [rpc_endpoints]
   sepolia = "https://sepolia.base.org"
   ```

2. **Deploy contracts**
   ```bash
   forge script script/Interaction.s.sol:InteractScript \
     --rpc-url sepolia \
     --broadcast \
     --verify
   ```

## 🙏 Acknowledgments

- [1inch Network](https://1inch.io/) for the excellent limit order protocol
- [OpenZeppelin](https://openzeppelin.com/) for secure smart contract libraries
- [Foundry](https://getfoundry.sh/) for the development framework
