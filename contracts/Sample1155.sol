// SPDX-License-Identifier: UNLICENSED

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';

pragma solidity ^0.8.0;

contract Sample1155 is ERC1155, Ownable {
    constructor() ERC1155('https://sample1155.herokuapp.com/token/{id}') {
        _mint(msg.sender, 1, 1, '');
    }

    function mintBatch(uint256[] memory ids, uint256[] memory amounts) public {
        _mintBatch(msg.sender, ids, amounts, '');
    }

    function mint(uint256 id, uint256 amount) public {
        _mint(msg.sender, id, amount, '');
    }
}
