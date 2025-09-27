// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OptionNFT is ERC721, Ownable {
    uint256 private _id;

    mapping(uint256 => string) private _metadataURI;

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) Ownable(msg.sender) {}

    function mint(address to, string calldata uri) external onlyOwner returns (uint256) {
        _id++;
        uint256 tokenId = _id;
        _safeMint(to, tokenId);
        if (bytes(uri).length > 0) {
            _metadataURI[tokenId] = uri;
        }
        return tokenId;
    }

    function burn(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
        delete _metadataURI[tokenId];
    }

    function setURI(uint256 tokenId, string calldata uri) external onlyOwner {
        _metadataURI[tokenId] = uri;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return _metadataURI[tokenId];
    }
}
