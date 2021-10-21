import Web3 from 'web3';
import fetch from 'node-fetch-retry';
import { createHmac } from 'crypto';
import { createAlchemyWeb3 } from '@alch/alchemy-web3';

const NETWORK = process.env.NETWORK.toLowerCase();
const INFURA_API_KEY = process.env.INFURA_API_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const BIRTHBLOCK_WEBHOOK_URL = process.env.BIRTHBLOCK_WEBHOOK_URL;
const EVENT_FORWARDER_AUTH_TOKEN = process.env.EVENT_FORWARDER_AUTH_TOKEN;
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

const infuraNetworkString = NETWORK == 'ethereum' ? 'mainnet' : `${NETWORK}`;
const alchemyNetworkString = NETWORK == 'ethereum' ? 'mainnet' : `${NETWORK}`;
const etherscanNetworkString = NETWORK == 'ethereum' ? '' : `-${NETWORK}`;
const providerURL = `wss://${infuraNetworkString}.infura.io/ws/v3/${INFURA_API_KEY}`;

// const web3 = new Web3();
const web3 = createAlchemyWeb3(
    `wss://eth-${alchemyNetworkString}.ws.alchemyapi.io/ws/${ALCHEMY_API_KEY}`,
);

console.log(`wss://eth-${alchemyNetworkString}.ws.alchemyapi.io/v2/${ALCHEMY_API_KEY}`);

// const debug = (...messages) => console.log(...messages);
// /**
//  * Refreshes provider instance and attaches even handlers to it
//  */
// function refreshProvider(web3Obj, providerUrl) {
//     let retries = 0;

//     function retry(event) {
//         if (event) {
//             debug(['event', event]);
//             debug('Web3 provider disconnected or errored.');
//             retries += 1;

//             if (retries > 5) {
//                 debug(`Max retries of 5 exceeding: ${retries} times tried`);
//                 return setTimeout(refreshProvider, 5000);
//             }
//         } else {
//             debug(`Reconnecting web3 provider`);
//             refreshProvider(web3Obj, providerUrl);
//         }

//         return null;
//     }

//     const provider = new Web3.providers.WebsocketProvider(providerUrl);

//     provider.on('end', (e) => retry(e));
//     provider.on('error', (e) => retry(e));

//     web3Obj.setProvider(provider);

//     debug('New Web3 provider initiated');

//     return provider;
// }

// refreshProvider(web3, providerURL);

const fetchBaseOptions = {
    retry: 12,
    pause: 2000,
    callback: (retry) => {
        console.log(`Retrying: ${retry}`);
    },
};

const signMessage = (body) => {
    const hmac = createHmac('sha256', EVENT_FORWARDER_AUTH_TOKEN); // Create a HMAC SHA256 hash using the auth token
    hmac.update(JSON.stringify(body), 'utf8'); // Update the token hash with the request body using utf8
    const digest = hmac.digest('hex');
    return digest;
};

const fetcher = (url, options) => fetch(url, options).then((r) => r.json());

const getContractAbi = async (contractAddress) =>
    await fetcher(
        `https://api${etherscanNetworkString}.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`,
        fetchBaseOptions,
    );

const { result: contractAbi } = await getContractAbi(CONTRACT_ADDRESS);

const contract = new web3.eth.Contract(JSON.parse(contractAbi), CONTRACT_ADDRESS);

const webhookOptions = (body) => ({
    ...fetchBaseOptions,
    method: 'post',
    body: JSON.stringify(body),
    headers: {
        'Content-Type': 'application/json',
        'x-Event-Forwarder-Signature': signMessage(body),
    },
});

console.log(
    `listening on https://${
        NETWORK == 'ethereum' ? '' : NETWORK
    }.etherscan.io/address/${CONTRACT_ADDRESS}`,
);

contract.events
    .Mint()
    .on('data', async (event) => {
        const body = {
            minterAddress: event.returnValues[0],
            tokenId: event.returnValues[1],
        };

        const data = await fetcher(BIRTHBLOCK_WEBHOOK_URL, webhookOptions(body));

        console.log('data:', data);
    })
    .on('error', (error) => {
        console.log('error:', error);
    })
    .on('end', () => console.log('connectnion ended'));
