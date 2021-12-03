import { createHmac } from 'crypto';
import fetch from 'node-fetch-retry';

export const BIRTHBLOCK_WEBHOOK_URL = process.env.BIRTHBLOCK_WEBHOOK_URL;
export const BIRTHBLOCK_CONTRACT_ADDRESS = process.env.BIRTHBLOCK_CONTRACT_ADDRESS;

export const TOKEN_GARDEN_WEBHOOK_URL = process.env.TOKEN_GARDEN_WEBHOOK_URL;
export const TOKEN_GARDEN_CONTRACT_ADDRESS = process.env.TOKEN_GARDEN_CONTRACT_ADDRESS;

export const EVENT_FORWARDER_AUTH_TOKEN = process.env.EVENT_FORWARDER_AUTH_TOKEN;
export const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
export const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
export const INFURA_ID = process.env.INFURA_ID;
export const NETWORK = process.env.NETWORK.toLowerCase();
export const SLACK_API_TOKEN = process.env.SLACK_API_TOKEN;
export const blackholeAddress = '0x0000000000000000000000000000000000000000';

export const conversationId = 'C02M123F48N'; // The-Metagame #mints channel

export const signMessage = (body) => {
    const hmac = createHmac('sha256', EVENT_FORWARDER_AUTH_TOKEN); // Create a HMAC SHA256 hash using the auth token
    hmac.update(JSON.stringify(body), 'utf8'); // Update the token hash with the request body using utf8
    const digest = hmac.digest('hex');
    return digest;
};

export const fetchBaseOptions = {
    retry: 4,
    pause: 2000,
    callback: (retry) => {
        console.log(`Retrying: ${retry}`);
    },
};

export const webhookOptions = (body) => ({
    ...fetchBaseOptions,
    method: 'post',
    body: JSON.stringify(body),
    headers: {
        'content-type': 'application/json',
        'x-event-forwarder-signature': signMessage(body),
    },
});

function getNetworkString(network) {
    switch (network) {
        case 'ethereum':
            return {
                alchemy: 'eth-mainnet.',
                etherscan: '',
                etherscanAPI: 'api.',
                opensea: '',
                openseaAPI: 'api.',
            };

        default:
            return {
                alchemy: `eth-${network}.`,
                etherscan: `${network}.`,
                etherscanAPI: `api-${NETWORK}.`,
                opensea: 'testnets.',
                openseaAPI: `${NETWORK}-api.`, // rinkeby only for now
            };
    }
}

export const networkStrings = getNetworkString(NETWORK);

export class FetcherError extends Error {
    constructor({ message, status, statusText, url, bodySent }) {
        super(message);
        this.name = 'Fetcher Error';
        this.status = status;
        this.statusText = statusText;
        this.url = url;
        this.bodySent = bodySent;
    }
    toJSON() {
        return {
            name: this.name,
            status: this.status,
            statusText: this.statusText,
            url: this.url,
            bodySent: this.bodySent,
        };
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function fetcher(url, options) {
    let retry = 3;
    while (retry > 0) {
        const response = await fetch(url, options);
        if (response.ok) {
            return response.json();
        } else {
            const error = {
                status: response.status,
                statusText: response.statusText,
                url: response.url,
                bodySent: options.body ? JSON.parse(options.body) : null,
                message: await response.text(),
            };
            console.log(error); // TODO logflare and slack?
            retry--;
            if (retry === 0) {
                throw new FetcherError(error);
            }
            await sleep(2000);
        }
    }
}

export function openseaForceUpdateURL(tokenId, contractAddress) {
    return `https://${networkStrings.openseaAPI}opensea.io/api/v1/asset/${contractAddress}/${tokenId}/?force_update=true`;
}

export async function getContractAbi(contractAddress) {
    await fetcher(
        `https://${networkStrings.etherscanAPI}etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`,
        fetchBaseOptions,
    );
}

export function newMintString(userName, tokenId, nftName) {
    return `${userName} just minted #${tokenId} for ${nftName} https://${networkStrings.opensea}opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId}`;
}
