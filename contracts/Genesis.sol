// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract Genesis is ERC721Enumerable, Ownable {
    mapping(uint256 => string) private _rings;

    constructor() ERC721('Genesis', 'GA') {}

    function mintRing(string calldata ring) public {
        uint256 tokenId = totalSupply() + 1;
        _mint(msg.sender, tokenId);
        _rings[tokenId] = ring;
    }

    function getRing(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), 'Token doesnt exist');
        return _rings[tokenId];
    }
}
