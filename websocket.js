import { WebSocket } from 'ws';
const ws = new WebSocket('ws://localhost:26657/websocket');

ws.on('error', console.error);

ws.on('open', function open() {
    ws.send(JSON.stringify(
        {
            "jsonrpc": "2.0",
            "method": "subscribe",
            "id": 0,
            "params": {
                "query": "tm.event='NewBlock'"
            }
        }
    ));
});

ws.on('message', function message() {
  start();
});





// Importing necessary modules from the 'secretjs' library
import { Wallet, SecretNetworkClient, MsgExecuteContract } from "secretjs";

// Creating a new instance of the 'Wallet' class with a mnemonic phrase as its argument
const wallet = new Wallet(
  "",
);

// URL for the blockchain's REST API
const url = "https://lcd.secret.express";

// Creating a new instance of the 'SecretNetworkClient' class
const secretjs = new SecretNetworkClient({
  url, // Passing in the URL variable as the 'url' argument
  chainId: "secret-4", // Specifying the chain ID for the network being used
  wallet: wallet, // Passing in the 'wallet' object as the 'wallet' argument
  walletAddress: wallet.address, // Specifying the wallet's address
});

// Initializing constants for the contract addresses and their respective code hashes
const closed_vaults = "secret18y86hldtdp9ndj0jekcch49kwr0gwy7upe3ffw";
const closed_vaultsHash = "148a525ec7bffedfc41cbc5339bf22d9e310d49b65831a269c86774fb732948c";
const current_vaults = "secret1qxk2scacpgj2mmm0af60674afl9e6qneg7yuny";
const current_vaultsHash = "ac5d501827d9a337a618ca493fcbf1323b20771378774a6bf466cb66361bf021";

// Initializing empty objects for the response data
let vaultsResponse = {};
let liquidatablePositions = {};


// Defining properties for the 'vaultsResponse' object
Object.defineProperties(vaultsResponse, {
  vaults: {},
  page: {},
  total_pages: {},
  total_vaults: {},
});

// Defining properties for the 'liquidatablePositions' object
Object.defineProperties(liquidatablePositions, {
  positions: {},
  vault_id: {},
});

let vaultsResponseArray = [];


// Defining an async function to be run at set intervals
async function vault_check(vault, hash){
    // Querying the contract and storing the response in the 'vaultsResponse' object
    vaultsResponse = await secretjs.query.compute.queryContract({
      contract_address: vault,
      code_hash: hash,
      query: { "vaults": { "starting_page": '1' } },
    });
    vaultsResponse.name = vault;
    vaultsResponse.hash = hash;
    let found = Boolean;
    for (let i = 0; i < vaultsResponseArray.length; i++) {
      if (vaultsResponseArray[i].name = vault){
        vaultsResponseArray[i] = vaultsResponse;
        found = true;
      };
    };
    if (found !== true) {
      vaultsResponseArray.push(vaultsResponse);
    };
};


function start(vault, hash) {
  for (let j = 0; j < vaultsResponseArray.length; j++) {
  // Looping through the 'vaults' array in the 'vaultsResponse' object
    for (let i = 1; i <= vaultsResponseArray[j].vaults.length; i++) {
      // Calling the 'loop' function with the current index and the contract address/code hash as arguments
      position_check(i, vaultsResponseArray[j].name, vaultsResponseArray[j].hash);
    };
  }
};
// Asynchronous function to query liquidatable positions for a given vault and hash
async function position_check(i, vault, hash) {
  // Querying the contract for liquidatable positions and storing the response in the 'liquidatablePositions' object
  liquidatablePositions = await secretjs.query.compute.queryContract({
    contract_address: vault,
    code_hash: hash,
    query: { 'liquidatable_positions': { 'vault_id' : i.toString() } },
  });

  // Checking if there are any liquidatable positions in the response
  if (liquidatablePositions.positions.length > 0 ) {
    console.log(liquidatablePositions);
    let risky_vault_id = liquidatablePositions.vault_id;
    let risky_position_id = liquidatablePositions.positions[0].position_id;
    // Calling the 'liquidateMSG' function with the necessary arguments to liquidate the risky position
    liquidate(vault, hash, risky_vault_id, risky_position_id);
  };
};
  
  
  // Asynchronous function to send a liquidation message to the contract
  async function liquidate(vault, hash, risky_vault_id, risky_position_id) {
	// Creating a new message to execute the liquidation
	let msg = new MsgExecuteContract({
	  sender: secretjs.address,
	  contract_address: vault,
	  code_hash: hash,
	  msg: {
		liquidate: {
		  vault_id: risky_vault_id,
		  position_id: risky_position_id
		}
	  }
	});
  
	// Broadcasting the transaction to the Secret Network
	const tx = await secretjs.tx.broadcast([msg], {
	  gasLimit: 1_000_000,
	  gasPriceInFeeDenom: 0.1,
	  feeDenom: "uscrt",
	});
	console.log(tx);
  };
  
// Define a function to run at a regular interval for the current vaults
function checkCurrentVaults(){
    vault_check(current_vaults, current_vaultsHash);
}

// Define a function to run at a regular interval for the closed vaults
function checkClosedVaults(){
    vault_check(closed_vaults, closed_vaultsHash)
}

async function checkVaults(){
	checkCurrentVaults();
	checkClosedVaults();
}

checkVaults();
setInterval (checkVaults, 100000);

console.log("🌎");
