// import necessary functions from the "secretjs" library
import { Wallet, SecretNetworkClient, MsgExecuteContract } from "secretjs";

// create a new wallet instance with a given mnemonic seed phrase
const wallet = new Wallet(
  "",
);

// specify the URL of the Secret Network node to interact with
const url = "https://lcd.secret.express";

// create a new SecretNetworkClient instance with the specified parameters
const secretjs = new SecretNetworkClient({
  url,
  chainId: "secret-4",
  wallet: wallet,
  walletAddress: wallet.address,
});

// define an object that maps contract names to their corresponding addresses and hashes
const silk_pools = {
  contract: {
    ist: 'secret1lrlfevkpmwc0kfxl9e59x0er5d8pzh48t68m0e', 
    cmst: 'secret1cqk6t9jjzqelwm0f72n5u2utvljdfgsq047cqu',
    usdc: 'secret1qz57pea4k3ndmjpy6tdjcuq4tzrvjn0aphca0k',
    usdt: 'secret10szrjlyza5u7yqcqvqenf28nmhwph4pad9csyw'
  },
  hash: {
    ist: 'e88165353d5d7e7847f2c84134c3f7871b2eee684ffac9fcf8d99a4da39dc2f2',
    cmst: 'e88165353d5d7e7847f2c84134c3f7871b2eee684ffac9fcf8d99a4da39dc2f2',
    usdc: 'e88165353d5d7e7847f2c84134c3f7871b2eee684ffac9fcf8d99a4da39dc2f2',
    usdt: 'e88165353d5d7e7847f2c84134c3f7871b2eee684ffac9fcf8d99a4da39dc2f2'
  }
};


// create an array of values from the silk_pools.contract object
const pool_contract_array = Object.values(silk_pools.contract);

// create an array of keys from the silk_pools.contract object
const pool_names_array =Object.keys(silk_pools.contract);

// create an array of values from the silk_pools.hash object
const pool_hash_array = Object.values(silk_pools.hash);

// create an object containing contract addresses, transaction hashes, and private keys for the SNIP token
const snip_contracts = {
	contract: {
		ist: 'secret1xmqsk8tnge0atzy4e079h0l2wrgz6splcq0a24', 
		cmst: 'secret14l7s0evqw7grxjlesn8yyuk5lexuvkwgpfdxr5',
		usdc: 'secret1vkq022x4q8t8kx9de3r84u669l65xnwf2lg3e6',
		usdt: 'secret1wk5j2cntwg2fgklf0uta3tlkvt87alfj7kepuw',
		silk: 'secret1fl449muk5yq8dlad7a22nje4p5d2pnsgymhjfd'
	},
	hash: {
		ist: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
		cmst: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
		usdc: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
		usdt: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
		silk: '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e',
	},
	key: {
		ist: '8304fca9d8b78c5f21e9505247ae0f957bf3e4b1b78a0c6f73244e0507554b49', 
		cmst: 'e42770ce1319794fd1135aa21240e2ecc865dacf014a89d8d6956cf95e21bcba',
		usdc: '32b3ef5090b9f432a09ac6a2e5aa91351d82d0bcbfb3bf28eaec4977e1c1aa24',
		usdt: 'c5a62877f7ad62791b1a23ce63cde13b55b24c1c5b6739e9be65c3b84e5ab2ba',
		silk: 'bd3d2266d346976854afff253b7f1d60603345ce9b89ed8fadab6da51e646a31',
	},
};

// create an array of values from the snip_contracts object
const snip_contracts_array = Object.values(snip_contracts.contract);
const snip_hash_array = Object.values(snip_contracts.hash);

// set the simamount to a fixed value
const simamount = '1000000';

// initialize a variable sell_profit_threshold
var sell_profit_threshold = 1;

// Define an async function that takes several parameters and returns a computed query result
// This function calculates the estimated swap price for the given parameters
async function swapSimulation(pool, hash, token, tokenHash, amount, pathA){
	try {
		// compute a query to the secret network
		let swapQuery = await secretjs.query.compute.queryContract({
			contract_address: pool,
			code_hash: hash,
			query: {
				swap_simulation: {
					offer: {
						token: {
							custom_token: {
								contract_addr: token,
								token_code_hash: tokenHash
							}
						},
						amount: amount
					},
					path: [pathA]
				}
			}
		});
		// return the estimated swap price from the computed query result
		return(swapQuery.swap_simulation.price);
	} catch (error) {
		throw new Error("Query Failed");
	}
};



// Asynchronously finds the prices of silk across all the liquidity pools
async function findSilkPrices(){
	// Initializes an empty array to store silk prices for each pool
	let silk_prices_array = [];

	// Loops through all the liquidity pools
	for (let i = 0; i < pool_contract_array.length; i++) {
		// Calls the swapSimulation() function to simulate swapping 1M SNIP for silk for the current pool
		let a = await swapSimulation(pool_contract_array[i], pool_hash_array[i], snip_contracts.contract.silk, snip_contracts.hash.silk, simamount, pool_contract_array[i]);

		// Logs the name of the current pool and its current silk price
		console.log(pool_names_array[i], ' pool vaules silk at ', a);

		// Converts the silk price from a string to a number and adds it to the silk_prices_array
		silk_prices_array.push(Number(a));
	}

	// Calls the highestAndLowest() function to find the highest and lowest silk prices among all the pools
	highestAndLowest(silk_prices_array);
};

// Finds the pool with the highest and lowest silk prices, and logs their names and prices
function highestAndLowest(a){
	// Initializes variables to store the lowest and highest silk prices and their corresponding pool indices
	let lowest_price;
	let highest_price;
	let b;
	let c;

	// Loops through all the silk prices and compares them to find the highest and lowest prices
	for (let i = 0; i < a.length; i++) {
		if (a[i] < lowest_price || lowest_price == undefined){
			// Updates the lowest price and its corresponding pool index if the current price is lower
			lowest_price = a[i];
			b = i;
		} else if (a[i] > highest_price || highest_price == undefined){
			// Updates the highest price and its corresponding pool index if the current price is higher
			highest_price = a[i];
			c = i;
		}
	}

	// Logs the name of the pool with the lowest silk price and its price
	console.log(pool_names_array[b], ' values silk the least at ', lowest_price);

	// Logs the name of the pool with the highest silk price and its price
	console.log(pool_names_array[c], ' values silk the most at ', highest_price);

	// Calls the findPercentDifference() function to find the percentage difference between the highest and lowest prices
	findPercentDifference(b, lowest_price, c, highest_price);
};


// This function calculates the percentage difference between two prices and checks whether it exceeds the sell profit threshold.
function findPercentDifference(w, x, y, z){
	// Calculate the absolute difference between the two prices
	let a = (z - x);
	// Calculate the average of the two prices
	let b = ((z + x)/2);
	// Calculate the percentage difference between the two prices
	let percent_difference = ((a/b)*100).toFixed(2);
	// Log the percentage difference between the two prices
	console.log('there is a ',percent_difference, '% between the two prices');
	// Check if the percentage difference exceeds the sell profit threshold
	if (percent_difference >= sell_profit_threshold) {
	  	console.log('sell profit threshold reached');
		send(w,y);
	} else {
	  console.log('sell profit threshold not reached');
	}
  };
  

async function send(w, y){
	let hookmsg = {
		swap_tokens_for_exact: {
			offer: {
				token: {
					custom_token: {
						contract_addr: snip_contracts_array[w],
						token_code_hash: snip_hash_array[w]
					}
				},
				amount: simamount
			},
			path: [
				{"addr":pool_contract_array[w],"code_hash": pool_hash_array[w]}, 
				{"addr": pool_contract_array[y], "code_hash":  pool_hash_array[y]},
			],
		}
	}
	let hookmsg64 = Buffer.from(JSON.stringify(hookmsg)).toString("base64");
	let msg = new MsgExecuteContract({
		sender: secretjs.address,
		contract_address: snip_contracts_array[w],
		code_hash: snip_hash_array[w],
		msg: {
			send: {
				recipient: "secret1pjhdug87nxzv0esxasmeyfsucaj98pw4334wyc",
				recipient_code_hash: "448e3f6d801e453e838b7a5fbaa4dd93b84d0f1011245f0d5745366dadaf3e85",
				amount: simamount,
				msg: hookmsg64
			}
		}
	});
	let resp = await secretjs.tx.broadcast([msg], {
		gasLimit: 5_000_000,
		gasPriceInFeeDenom: 0.1,
		feeDenom: "uscrt",
	});
	console.log("sold ", (simamount/1000000), " ", pool_names_array[w], " for ", pool_names_array[y]);

};

findSilkPrices();
console.log("🌎");
