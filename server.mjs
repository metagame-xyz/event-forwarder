import Web3 from 'web3';
import fetch from 'node-fetch-retry';

const NETWORK = process.env.NETWORK.toLowerCase();
const INFURA_API_KEY = process.env.INFURA_API_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const infuraNetworkString = NETWORK == 'ethereum' ? 'mainnet' : `${NETWORK}`;
const etherscanNetworkString = NETWORK == 'ethereum' ? '' : `-${NETWORK}`;
const providerURL = `wss://${infuraNetworkString}.infura.io/ws/v3/${INFURA_API_KEY}`;

const web3 = new Web3(providerURL);

const fetchOptions = {
    retry: 12,
    pause: 2000,
    callback: (retry) => {
        console.log(`Retrying: ${retry}`);
    },
};

const fetcher = (url) => fetch(url, fetchOptions).then((r) => r.json());

const getContractAbi = async (contractAddress) =>
    await fetcher(
        `https://api${etherscanNetworkString}.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`,
    );

const { result: contractAbi } = await getContractAbi(CONTRACT_ADDRESS);

const contract = new web3.eth.Contract(JSON.parse(contractAbi), CONTRACT_ADDRESS);

contract.events
    .Mint()
    .on('data', (event) => {
        console.log('new minter:', event.returnValues[0]);
        console.log('tokenId:', event.returnValues[1]);
    })
    .on('error', (error) => {
        console.log('error:', error);
    });
