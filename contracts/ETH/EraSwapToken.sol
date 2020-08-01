// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20FixedSupplyPausable is ERC20Pausable, Ownable {
    constructor() ERC20("EraSwap", "ES") {
        _mint(msg.sender, 9100000000 ether);
    }

    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
