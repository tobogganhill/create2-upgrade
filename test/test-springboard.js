const Springboard = artifacts.require('Springboard');
const Wallet = artifacts.require('Wallet');
const WalletV2 = artifacts.require('WalletV2');
const ethers = require('ethers');
const utils = ethers.utils;

const initcode = "0x6394198df1600052600060006004601c335afa80601b57600080fd5b3d600060203e6040516060f3";

function calculateAddress(creatorAddress, salt, initCode) {
   const initCodeHash = utils.keccak256(initCode);
   return utils.getAddress(utils.hexDataSlice(utils.keccak256(
      utils.concat([
         "0xff",
         creatorAddress,
         salt,
         initCodeHash
      ])), 12));
}

// Springboard contract is a factory of wallet contracts
contract("Springboard", accounts => {
   let springboard;
   before(async () => {
      springboard = await Springboard.deployed();
   });

   it("Upgrade wallet v1 to v2 should work", async () => {
      const runtimeCode = Wallet.deployedBytecode;
      let tx = await springboard.execute(runtimeCode);
      assert.equal(tx.logs.length, 1, "should have 1 event log");
      assert.equal(tx.logs[0].event, "ContractCreated", "different event");

      // the new wallet contract address is logged in the event log
      let walletAddress = tx.logs[0].args[0];
      const salt = utils.keccak256(accounts[0]);
      const expectedAddress = calculateAddress(springboard.address, salt, initcode);
      assert.equal(expectedAddress, walletAddress, "address mismatch");

      // check the contract version
      const walletV1 = await Wallet.at(walletAddress);
      let version = await walletV1.version();

      console.log(walletAddress, version);
      assert.equal(version, "1.0", "version should be 1.0");

      // Lab Assignment starts here --------------------------------------------------
      // 1) Upgrade wallet to V2
      // 2) verify wallet version == 2.0 after upgrade
      // check the contract version

      // self destruct Version 1 of the contract
      let kill = await walletV1.die();

      const runtimeCodeV2 = WalletV2.deployedBytecode;
      let txV2 = await springboard.execute(runtimeCodeV2);

      assert.equal(txV2.logs.length, 1, "should have 1 event log");
      assert.equal(txV2.logs[0].event, "ContractCreated", "different event");

      // the new wallet contract address is logged in the event log
      let walletAddressV2 = txV2.logs[0].args[0];
      const saltV2 = utils.keccak256(accounts[0]);
      const expectedAddressV2 = calculateAddress(springboard.address, saltV2, initcode);
      assert.equal(expectedAddressV2, walletAddressV2, "address mismatch");

      walletV2 = await WalletV2.at(walletAddressV2);
      versionV2 = await walletV2.version();

      console.log(walletAddressV2, versionV2);
      assert.equal(versionV2, "2.0", "version should be 2.0");

   });
});