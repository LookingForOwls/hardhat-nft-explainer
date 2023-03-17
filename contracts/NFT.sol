// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

// Import ERC721A Contracts
import "erc721a/contracts/ERC721A.sol";

// Import Ownable contract from the OpenZeppelin Contracts library. 
// This allows you to limit function access to only the deployer wallet.
import "@openzeppelin/contracts/access/Ownable.sol";

// Using 'is" means NFT inhereits functions and variables from ERC721A and Ownable
contract NFT is ERC721A, Ownable {

    // Constructor initializes the state of the ERC721A contract and sets the Token Name and Symbol
    constructor() ERC721A("NFT NAME", "SYMBOL") {}

    
    // Lets define some variables: You need a type , visibility, and name.
    //
    // ------------------------------------------------------------------------------------------\\
    // Constants
    // ------------------------------------------------------------------------------------------\\
    /// @notice CAN NOT be changed after deployment and should always be in SNAKE_CASE

    // Max number of NFTs that can be minted.
    uint256 public constant MAX_SUPPLY = 100;

    // Max number a user can mint in a single transaction
    uint256 public constant MAX_MINT = 5;

    // ------------------------------------------------------------------------------------------\\
    // Non-constant state variables
    // ------------------------------------------------------------------------------------------\\
    /// @notice CAN be updated after deployment and should be in camelCase;
    
    // Price per NFT mint.
    /// @dev the `ether` suffix allows us to use easy to read decimals (0.01) instead of wei (10000000000000000). 
    /// @notice Read more about included units here: https://docs.soliditylang.org/en/v0.8.19/units-and-global-variables.html
    uint256 public mintPrice = 0.01 ether;

    // BaseURI
    /// @notice This is the base value used to return the correct metadata for a token. 
    string public baseURI;

    // Admin Wallet
    /// @notice Admin address used for withdrawing funds.
    address public adminWallet;


    // ------------------------------------------------------------------------------------------\\
    // Admin Functions
    // ------------------------------------------------------------------------------------------\\
    /// @notice These protected functions can only be called by the owner of the contract. 
    //          Take note of the `onlyOwner` modifier. 
    
    ///
    /// @param _newBaseURI New baseURI you want to use. Always include trailing slash. eg. http://mymetadataserver.com/metadata/
    /// @notice baseURI will be combined with tokenId to make tokenURI. eg. http://mymetadataserver.com/metadata/1
    ///         The _newBaseURI variable is local only to the function and exists only while its executing. 
    ///         This function sets the persistent BaseURI state variable to the _newBaseURI local variable that you pass when calling it. 

    function setBaseURI(string calldata _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
    }
 
    /// 
    /// @param _adminWallet Address to set admin wallet to
    function setAdminWallet(address _adminWallet) external onlyOwner {
        adminWallet = _adminWallet;
    }

    /// 
    /// @param _mintPrice New mint price
    function updatePrice(uint256 _mintPrice) external onlyOwner {
        mintPrice = _mintPrice;
    }

    /// @notice Withdraws funds to set admin wallet.
    function withdrawFunds() external onlyOwner {
        // Ensures admin wallet is set. Prevents accidentally sending ETH to burn address!
        require(adminWallet != address(0), "Admin wallet not set");
        // solhint-disable-next-line avoid-low-level-calls
        (bool teamSuccess,) = adminWallet.call{ value: address(this).balance }("");
        require(teamSuccess, "Transfer failed.");
    }


    // ------------------------------------------------------------------------------------------\\
    // Public Functions
    // ------------------------------------------------------------------------------------------\\
    
    /// 
    /// @param quantity Number of NFTs to mint
    function mint(uint256 quantity) external payable  {
        // Ensure mint quanity <= MAX_MINT constant. If not, revert tx. 
        require(quantity <= MAX_MINT, "Over mint limit");
        
        // Ensure user pays the correct amount for their mints. If not, revert tx. 
        /// @notice msg.value is automatically set to the amount of Ether sent with the transaction.
        require(msg.value == mintPrice * quantity, "Wrong ETH value");

        /// Ensure current supply + quanity is not over MAX_SUPPLY. If not, revert tx. 
        /// @notice totalSupply() is a function in the ERC721A contract which returns the total number of minted tokens. 
        require(totalSupply() + quantity <= MAX_SUPPLY, "Max supply reached");

        // Mint specified quantity of tokens to wallet calling mint function.
        _mint(msg.sender, quantity);
    }


    // ------------------------------------------------------------------------------------------\\
    // Function Overrides
    // ------------------------------------------------------------------------------------------\\
    /// @notice These are used to override default behavior of inherited functions. 
    ///         In this case both are from the ERC721A contract. 

    /// @notice Overrides ERC721A tokenId to start at 1 instead of 0
    function _startTokenId() internal view virtual override returns (uint256) {
        return 1;
    }

    /// @notice Overrides ERC721A baseURI function to concat baseURI+tokenId. Necessary for each token to have its own tokenURI.
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }
}
