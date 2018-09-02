pragma solidity ^0.4.24;

contract ERC20 {
    function transfer(address receiver, uint amount) public returns (bool);
    function transferFrom(address sender, address receiver, uint amount) public returns (bool);
}