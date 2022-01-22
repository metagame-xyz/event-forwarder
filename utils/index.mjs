import { createHmac } from 'crypto';
import fetch from 'node-fetch-retry';

import { logError, logWarning } from './logging.mjs';
export const BIRTHBLOCK_WEBHOOK_URL = process.env.BIRTHBLOCK_WEBHOOK_URL;
export const BIRTHBLOCK_CONTRACT_ADDRESS = process.env.BIRTHBLOCK_CONTRACT_ADDRESS;

export const TOKEN_GARDEN_WEBHOOK_URL = process.env.TOKEN_GARDEN_WEBHOOK_URL;
export const TOKEN_GARDEN_CONTRACT_ADDRESS = process.env.TOKEN_GARDEN_CONTRACT_ADDRESS;

export const HEARTBEAT_WEBHOOK_URL = process.env.HEARTBEAT_WEBHOOK_URL;
export const HEARTBEAT_CONTRACT_ADDRESS = process.env.HEARTBEAT_CONTRACT_ADDRESS;

export const EVENT_FORWARDER_AUTH_TOKEN = process.env.EVENT_FORWARDER_AUTH_TOKEN;

export const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
export const ALCHEMY_NOTIFY_TOKEN = process.env.ALCHEMY_NOTIFY_TOKEN;

export const ALCHEMY_NOTIFY_WEBHOOK_ID = process.env.ALCHEMY_NOTIFY_WEBHOOK_ID;

export const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
export const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY;

export const INFURA_ID = process.env.INFURA_ID;
export const NETWORK = process.env.NETWORK.toLowerCase();
export const SLACK_API_TOKEN = process.env.SLACK_API_TOKEN;
export const blackholeAddress = '0x0000000000000000000000000000000000000000';

export const alchemyUpdateWebhookAddressesURL =
    'https://dashboard.alchemyapi.io/api/update-webhook-addresses';

export const mintsChannelId = 'C02M123F48N'; // The-Metagame #mints channel
export const testnetMintsChannelId = 'C02V8TR888L';

export const channelId = NETWORK === 'ethereum' ? mintsChannelId : testnetMintsChannelId;

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

export const notifyOptions = (body) => ({
    ...fetchBaseOptions,
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: {
        'X-Alchemy-Token': ALCHEMY_NOTIFY_TOKEN,
        'Content-Type': 'application/json; charset=UTF-8',
    },
});

export const webhookOptions = (body) => ({
    ...fetchBaseOptions,
    method: 'post',
    body: JSON.stringify(body),
    headers: {
        'content-type': 'application/json',
        'x-event-forwarder-signature': signMessage(body),
    },
});

export const openseaFetchOptions = {
    ...fetchBaseOptions,
    headers: {
        'X-API-KEY': OPENSEA_API_KEY,
    },
};

export const AddAddressToTokenGardenListener = (addressToAdd) => ({
    webhook_id: ALCHEMY_NOTIFY_WEBHOOK_ID,
    addresses_to_add: [addressToAdd],
    addresses_to_remove: [],
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

export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const fetcherLogData = {
    level: 'error',
    function_name: 'fetcher',
    message: 'null??',
};

export async function fetcher(url, options, maxRetries = 3) {
    let retries = 0;
    while (maxRetries > retries) {
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
            retries++;
            fetcherLogData.thrown_error = error;
            logWarning(fetcherLogData, 'fetcher retry warning');
            if (maxRetries === retries) {
                logError(fetcherLogData, error);
                throw new FetcherError(error);
            }
            await sleep(1000 * 2 ** retries);
        }
    }
}

export function openseaForceUpdateURL(tokenId, contractAddress) {
    return `https://${networkStrings.openseaAPI}opensea.io/api/v1/asset/${contractAddress}/${tokenId}/?force_update=true`;
}

export const getContractAbi = async (contractAddress) =>
    await fetcher(
        `https://${networkStrings.etherscanAPI}etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`,
        fetchBaseOptions,
    );

export function newMintString(userName, tokenId, nftName, contractAddress) {
    return `${userName} just minted #${tokenId} for ${nftName} https://${networkStrings.opensea}opensea.io/assets/${contractAddress}/${tokenId}`;
}
