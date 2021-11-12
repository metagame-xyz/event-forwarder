import { createAlchemyWeb3 } from '@alch/alchemy-web3';
import {
    webhookOptions,
    BIRTHBLOCK_WEBHOOK_URL,
    fetcher,
    fetchBaseOptions,
    CONTRACT_ADDRESS,
} from './utils/index.mjs';

const NETWORK = process.env.NETWORK.toLowerCase();
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

const alchemyNetworkString = NETWORK == 'ethereum' ? 'mainnet' : `${NETWORK}`;
const etherscanNetworkString = NETWORK == 'ethereum' ? '' : `-${NETWORK}`;
const blackholeAddress = '0x0000000000000000000000000000000000000000';

const web3 = createAlchemyWeb3(
    `wss://eth-${alchemyNetworkString}.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
);

const getContractAbi = async (contractAddress) =>
    await fetcher(
        `https://api${etherscanNetworkString}.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`,
        fetchBaseOptions,
    );

let contractAbi;
try {
    ({ result: contractAbi } = await getContractAbi(CONTRACT_ADDRESS));
} catch (error) {
    console.error(error);
    process.exit(1);
}

const contract = new web3.eth.Contract(JSON.parse(contractAbi), CONTRACT_ADDRESS);

console.log(
    `listening on https://${
        NETWORK == 'ethereum' ? '' : NETWORK + '.'
    }etherscan.io/address/${CONTRACT_ADDRESS}`,
);

contract.events
    .Transfer({
        filter: { from: blackholeAddress },
    })
    .on('data', async (event) => {
        const body = {
            minterAddress: event.returnValues[1],
            tokenId: event.returnValues[2],
        };

        console.log(`${body.minterAddress} minted tokenId ${body.tokenId}`);

        let result;
        try {
            result = await fetcher(BIRTHBLOCK_WEBHOOK_URL, webhookOptions(body));
        } catch (error) {
            console.error('catching fetcher error');
            console.error(error);
        }

        if (result.error) {
            console.error(result.error);
        } else {
            console.log(
                `${result.minterAddress} with   tokenId ${result.tokenId} has been added or updated`,
            );
        }
    })
    .on('error', (error) => {
        console.log('error:', error);
    })
    .on('end', () => console.log('connectnion ended'));
