const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

/// Read more about testing contracts here: https://hardhat.org/tutorial/testing-contracts

describe("NFT Contract", function () {
  // deployNFTFixture() is used before each test to deploy a fresh version of the contract.
  async function deployNFTFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    // Get and deploy NFT contract
    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy();

    // Convert 0.01E price to wei
    const price = ethers.utils.parseEther("0.01")

    return { NFT, nft, owner, otherAccount, price };
  }

  describe("Deployment", function () {
    // Check public mintPrice var and compare to 0.1E price in WEI
    it("Should set the right mint price", async function () {

      const {  NFT, nft, owner, otherAccount, price } = await loadFixture(deployNFTFixture);
      
      expect(await nft.mintPrice()).to.equal(price);
    });


    // Check public MAX_SUPPLY variable
    it("Max supply should be 100", async function () {
      const {  NFT, nft, owner, otherAccount } = await loadFixture(deployNFTFixture);
      
      expect(await nft.MAX_SUPPLY()).to.equal(100);
    });


    // Check public MAX_MINT variable
    it("Max mint should be 5", async function () {
      const {  NFT, nft, owner, otherAccount } = await loadFixture(deployNFTFixture);
      
      expect(await nft.MAX_MINT()).to.equal(5);
    });

  });


  describe("Admin Functions", function () {
    // Set and check baseURI
    it("Should set baseURI", async function () {
      const {  NFT, nft, owner, otherAccount } = await loadFixture(deployNFTFixture);
      // BaseURI should be unset. 
      expect(await nft.baseURI()).to.equal("");
      
      // Update the baseUri
      await nft.setBaseURI("http://test/")
      
      // Ensure it was updated
      expect(await nft.baseURI()).to.equal("http://test/");
    });

    it("Should set tokenURI", async function () {
      const {  NFT, nft, owner, otherAccount } = await loadFixture(deployNFTFixture);
      // Convert mint cost to wei for convenience
      let mintFees = ethers.utils.parseEther("0.05")
      
      // Mint 5 NFTs
      await nft.mint(5, {
        value: mintFees
      });
      
      // Update the baseUri
      await nft.setBaseURI("http://test/")
      
      // Ensure uris correct
      expect(await nft.baseURI()).to.equal("http://test/");
      expect(await nft.tokenURI(1)).to.equal("http://test/1");
      expect(await nft.tokenURI(2)).to.equal("http://test/2");
    });



    // Set and check admin wallet
    it("Should set admint wallet", async function () {
      const {  NFT, nft, owner, otherAccount } = await loadFixture(deployNFTFixture);
      
      // Admin wallet should be unset. 
      expect(await nft.adminWallet()).to.equal("0x0000000000000000000000000000000000000000");
      
      // Update admin wallet to deployer address
      await nft.setAdminWallet(owner.address)
      
      // Ensure it was updated
      expect(await nft.adminWallet()).to.equal(owner.address);
    });


    // Set and check baseURI
    it("Should update mint price", async function () {
      const {  NFT, nft, owner, otherAccount, price } = await loadFixture(deployNFTFixture);
      // Mint price should be 0.01E. 
      expect(await nft.mintPrice()).to.equal(price);
      
      // Create new 0.02E price variable  
      let newPrice = ethers.utils.parseEther("0.02")
      
      // Update the Price
      await nft.updatePrice(newPrice)
      
      // Ensure it was updated
      expect(await nft.mintPrice()).to.equal(newPrice);
    });

    it("Should withdraw funds", async function () {
      const {  NFT, nft, owner, otherAccount } = await loadFixture(deployNFTFixture);

      let mintFees = ethers.utils.parseEther("0.05")
      
      // Ensure contract balance 0
      expect(await ethers.provider.getBalance(nft.address)).to.equal(0);
      // Ensure 0x1 address balance 0 for ease of testing
      expect(await ethers.provider.getBalance("0x0000000000000000000000000000000000000001")).to.equal(0);
      // Set 0x1 address as admin
      await nft.setAdminWallet("0x0000000000000000000000000000000000000001")
      // Mint some NFTs to get some ETH in the contract
      await nft.mint(5, {
        value: mintFees
      });
      
      // Check contract balance now = 0.05E
      expect(await ethers.provider.getBalance(nft.address)).to.equal(mintFees);
      
      // Withdraw
      await nft.withdrawFunds()

      // Check 0x1 wallet 
      expect(await ethers.provider.getBalance("0x0000000000000000000000000000000000000001")).to.equal(mintFees);
    });
  });

   describe("Public Functions", function () {

    it("Should mint 5 NFTs", async function () {
      const {  NFT, nft, owner, otherAccount } = await loadFixture(deployNFTFixture);
      
      // Convert mint cost to wei for convenience
      let mintFees = ethers.utils.parseEther("0.05")
      
      // Mint 5 NFTs
      await nft.mint(5, {
        value: mintFees
      });
      
      // Ensure balance
      expect(await nft.balanceOf(owner.address)).to.equal(5);
    });
  });


  /// All of these tests should fail. If they do not its a problem.
  describe("Reverting Functions", function () {
    
    
    it("Should NOT Mint >5 NFTs", async function () {
      const {  NFT, nft, owner, otherAccount } = await loadFixture(deployNFTFixture);
      
      // Convert mint cost to wei for convenience
      let mintFees = ethers.utils.parseEther("0.06")
      
      // Try to mint 6 NFTs ensure it fails with correct error
      await expect(nft.mint(6, {
        value: mintFees
      })).to.be.revertedWith("Over mint limit");
    });

    it("Should NOT Mint NFTs UNDER price", async function () {
      const {  NFT, nft, owner, otherAccount } = await loadFixture(deployNFTFixture);
      
      // Convert mint cost to wei for convenience
      let mintFees = ethers.utils.parseEther("0.005")
      
      // Try to mint NFT under price ensure it fails with correct error
      await expect(nft.mint(1, {
        value: mintFees
      })).to.be.revertedWith("Wrong ETH value");
    });

    it("Should NOT Mint NFTs OVER price", async function () {
      const {  NFT, nft, owner, otherAccount } = await loadFixture(deployNFTFixture);
      
      // Convert mint cost to wei for convenience
      let mintFees = ethers.utils.parseEther("0.02")
      
      // Try to mint NFT under price ensure it fails with correct error
      await expect(nft.mint(1, {
        value: mintFees
      })).to.be.revertedWith("Wrong ETH value");
    });


    // A bunch of tests on all the protected functions. Helpful to catch small mistakes when making changes.
    // Copy this pattern. 

    it("Should NOT set admint wallet if not owner", async function () {
      const {  NFT, nft, owner, otherAccount } = await loadFixture(deployNFTFixture);
      // connect to otherAccount with `nft.connect(account).<some_function>`and call function. 
      await expect(nft.connect(otherAccount).setAdminWallet(otherAccount.address)).to.be.revertedWith("Ownable: caller is not the owner")
    });

    it("Should NOT set baseURI if not owner", async function () {
      const {  NFT, nft, owner, otherAccount } = await loadFixture(deployNFTFixture);
      // connect to otherAccount with `nft.connect(account).<some_function>`and call function. 
      await expect(nft.connect(otherAccount).setBaseURI("haxor")).to.be.revertedWith("Ownable: caller is not the owner")
    });

    it("Should NOT update price if not owner", async function () {
      const {  NFT, nft, owner, otherAccount } = await loadFixture(deployNFTFixture);
      // connect to otherAccount with `nft.connect(account).<some_function>`and call function. 
      await expect(nft.connect(otherAccount).updatePrice(0)).to.be.revertedWith("Ownable: caller is not the owner")
    });

    it("Should NOT withdraw if not owner", async function () {
      const {  NFT, nft, owner, otherAccount } = await loadFixture(deployNFTFixture);
      // connect to otherAccount with `nft.connect(account).<some_function>`and call function. 
      await expect(nft.connect(otherAccount).withdrawFunds()).to.be.revertedWith("Ownable: caller is not the owner")
    });


  });

});
