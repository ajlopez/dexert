pragma solidity >=0.5.0 <0.6.0;

contract ERC20 {
    function transfer(address receiver, uint amount) public returns (bool);
    function transferFrom(address sender, address receiver, uint amount) public returns (bool);
}