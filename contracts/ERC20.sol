pragma solidity ^0.6.0;

interface ERC20 {
    function transfer(address receiver, uint amount) external returns (bool);
    function transferFrom(address sender, address receiver, uint amount) external returns (bool);
}