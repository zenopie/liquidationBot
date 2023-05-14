import { Wallet, SecretNetworkClient, MsgExecuteContract} from "secretjs";

const wallet = new Wallet(
  "your seed phrase here",
);
const stkd_scrt_viewkey = 'fccc5f66484c3b3485972f2ed36f413b5ca46748fc92558efac674e90aee12dc';
const sscrt_viewkey = 'e8371c5bf1bcf878afb429a2ce35104e1c2fc6061cabf0c97b4843dbb90213c8';


const url = "https://lcd-secret.whispernode.com:443";

const secretjs = new SecretNetworkClient({
  url,
  chainId: "secret-4",
  wallet: wallet,
  walletAddress: wallet.address,
});


const stkd_SCRT_contract = 'secret1k6u0cy4feepm6pehnz804zmwakuwdapm69tuc4';
const stkd_SCRT_contract_hash = 'f6be719b3c6feb498d3554ca0398eb6b7e7db262acb33f84a8f12106da6bbb09';
const sscrt_contract = 'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek';
const sscrt_hash = 'af74387e276be8874f07bec3a87023ee49b0e7ebe08178c49d0a49c3c98ed60e';
const swap_contract = "secret1y6w45fwg9ln9pxd6qys8ltjlntu9xa4f2de7sp";
const swap_contract_hash = "e88165353d5d7e7847f2c84134c3f7871b2eee684ffac9fcf8d99a4da39dc2f2";
let swapQuery = {};
let stkd_scrt_amount = 1; //needs work, used the same amount for sscrt and stkd-scrt
let simAmount = (stkd_scrt_amount * 1000000).toString();
const sell_profit_threshold = 5; //profit threshold needed to stake scrt and sell in percent
const stake_profit_threshold = 5; //profit needed to buy stkd-scrt and unbond in percent


Object.defineProperties(swapQuery, {
  total_fee_amount : {},
  lp_fee_amount : {},
  shade_dao_fee_amount : {},
  result : {},
  price : {},  
});

async function swapSimulation(){
	swapQuery = await secretjs.query.compute.queryContract({
		contract_address: swap_contract,
		code_hash: swap_contract_hash,
		query: {
			swap_simulation: {
				offer: {
					token: {
						custom_token: {
							contract_addr: stkd_SCRT_contract,
							token_code_hash: stkd_SCRT_contract_hash
						}
					},
					amount: simAmount
				},
				path: [ swap_contract ]
			}
		}
	});
	console.log('swap price: 1 stkd-scrt = ', swapQuery.swap_simulation.price, ' scrt');
	return parseFloat(swapQuery.swap_simulation.price);
};

async function stakingInfo(){
	const staking_info = await secretjs.query.compute.queryContract({
	  contract_address: stkd_SCRT_contract,
	  code_hash: stkd_SCRT_contract_hash,
	  query: {
		  staking_info: {
			  time : Date.now()
		  }
	  }
	});
	console.log('staking price: 1 stkd-scrt = ', parseFloat(staking_info.staking_info.price / 1000000), ' scrt');
	return parseFloat(staking_info.staking_info.price / 1000000);
};

async function holdingInfo(){
	let holding_info = await secretjs.query.compute.queryContract({
	  contract_address: stkd_SCRT_contract,
	  code_hash: stkd_SCRT_contract_hash,
	  query: {
		  holdings: {
			  address: secretjs.address,
			  key: stkd_scrt_viewkey,
			  time : Date.now()
		  }
	  }
	});
	return(holding_info);
};

async function querySscrt(){
	let sscrt_info = await secretjs.query.compute.queryContract({
	  contract_address: sscrt_contract,
	  code_hash: sscrt_hash,
	  query: {
		  balance: {
			  address: secretjs.address,
			  key: sscrt_viewkey,
			  time : Date.now()
		  }
	  }
	});
	return(sscrt_info);
};
async function stakeScrt(){
	let msg = new MsgExecuteContract({
		sender: secretjs.address,
		contract_address: stkd_SCRT_contract,
		code_hash: stkd_SCRT_contract_hash,
		msg: {
			stake: {}
		},
		sent_funds: [{	
			amount: simAmount,
			denom: 'uscrt'
		}],
	});
	let resp = await secretjs.tx.broadcast([msg], {
		gasLimit: 300_000,
		gasPriceInFeeDenom: 0.1,
		feeDenom: "uscrt",
	});
	console.log('staked scrt');
};

async function unstakeScrt(a){
	let msg = new MsgExecuteContract({
		sender: secretjs.address,
		contract_address: stkd_SCRT_contract,
		code_hash: stkd_SCRT_contract_hash,
		msg: {
			unbond: {
				redeem_amount: a.holdings.token_balance.toString()
			}
		}
	});
	let resp = await secretjs.tx.broadcast([msg], {
		gasLimit: 300_000,
		gasPriceInFeeDenom: 0.1,
		feeDenom: "uscrt",
	});
	console.log('unstaked scrt');
};

async function claimHolding(){
	let msg = new MsgExecuteContract({
		sender: secretjs.address,
		contract_address: stkd_SCRT_contract,
		code_hash: stkd_SCRT_contract_hash,
		msg: {
			claim: {}
		}
	});
	let resp = await secretjs.tx.broadcast([msg], {
		gasLimit: 300_000,
		gasPriceInFeeDenom: 0.1,
		feeDenom: "uscrt",
	});
	console.log('claimed holdings');
};

async function sellStkdscrt(a){
	let hookmsg = {
		swap_tokens: {
			offer: {
				token: {
					custom_token: {
						contract_addr: stkd_SCRT_contract,
						token_code_hash: stkd_SCRT_contract_hash
					}
				},
				amount: a.holdings.token_balance.toString()
			},
			path: [ swap_contract ]
		}
	}
	let hookmsg64 = btoa(JSON.stringify(hookmsg));
	let msg = new MsgExecuteContract({
		sender: secretjs.address,
		contract_address: stkd_SCRT_contract,
		code_hash: stkd_SCRT_contract_hash,
		msg: {
			send: {
				recipient: swap_contract,
				recipient_code_hash: swap_contract_hash,
				amount: a.holdings.token_balance.toString(),
				msg: hookmsg64
			}
		}
	});
	let resp = await secretjs.tx.broadcast([msg], {
		gasLimit: 1_000_000,
		gasPriceInFeeDenom: 0.1,
		feeDenom: "uscrt",
	});
	console.log('sold stkd-scrt');
};

async function buyStkdscrt(){
	let hookmsg = {
		swap_tokens: {
			offer: {
				token: {
					custom_token: {
						contract_addr: sscrt_contract,
						token_code_hash: sscrt_hash
					}
				},
				amount: simAmount
			},
			path: [ swap_contract ]
		}
	}
	let hookmsg64 = Buffer.from(JSON.stringify(hookmsg)).toString("base64");
	let msg = new MsgExecuteContract({
		sender: secretjs.address,
		contract_address: sscrt_contract,
		code_hash: sscrt_hash,
		msg: {
			send: {
				recipient: swap_contract,
				recipient_code_hash: swap_contract_hash,
				amount: simAmount,
				msg: hookmsg64
			}
		}
	});
	let resp = await secretjs.tx.broadcast([msg], {
		gasLimit: 1_000_000,
		gasPriceInFeeDenom: 0.1,
		feeDenom: "uscrt",
	});
	console.log('bought stkd-scrt');
};

async function wrapScrt(){
	let _msg = new MsgExecuteContract({
		sender: secretjs.address,
		contract_address: sscrt_contract,
		code_hash: sscrt_hash,
		msg: {
			deposit: {}
		},
		sent_funds: [{	
			amount: simAmount,
			denom: 'uscrt'
		}],
	});
	let resp = await secretjs.tx.broadcast([_msg], {
		gasLimit: 300_000,
		gasPriceInFeeDenom: 0.1,
		feeDenom: "uscrt",
	});
	console.log('wrapped scrt');
};

async function unwrapScrt(b){
	let msg = new MsgExecuteContract({
		sender: secretjs.address,
		contract_address: sscrt_contract,
		code_hash: sscrt_hash,
		msg: {
			redeem: {
				amount : b.balance.amount
			}
		},
	});
	let resp = await secretjs.tx.broadcast([msg], {
		gasLimit: 300_000,
		gasPriceInFeeDenom: 0.1,
		feeDenom: "uscrt",
	});
	console.log('scrt unwrapped');
};
function findPercentDifference(x,y){
	let a = (x - y);
	let b = ((x + y)/2);
	let percent_difference = ((a/b)*100).toFixed(2);
	if (x > y) {
		console.log('swap price is ',percent_difference, '% greater than staking price');
		if (percent_difference >= sell_profit_threshold) {
			console.log('sell profit threshold reached');
			stakeSell();
		} else {
			console.log('sell profit threshold not reached');
		}
	}
	if (x < y) {
		console.log('staking price is ',percent_difference * -1, '% greater than swap price');
		if ((percent_difference * -1) >= stake_profit_threshold){
			console.log('stake profit threshold reached');
			wrapBuy();
		} else {
			console.log('stake profitability threshold not reached');
		}
	}
};
async function stakeSell(){
	await stakeScrt();
	let a = await holdingInfo();
	await sellStkdscrt(a);
	let b = await querySscrt();
	await unwrapScrt(b);
};

async function wrapBuy(){
	await wrapScrt();
	await buyStkdscrt();
	let a = await holdingInfo();
	await unstakeScrt(a);
};

async function checkHoldings(){
	let z = await holdingInfo();
	if (z.holdings.unbonding_scrt > 0){
		claimHolding();
	}
};
	
	
async function foo() {
	await checkHoldings();
    let x = await swapSimulation();
    let y = await stakingInfo();
	findPercentDifference(x,y);
}
foo();
setInterval(foo, 10000000);











