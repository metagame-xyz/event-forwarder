import { createHmac } from 'crypto';
import fetch from 'node-fetch-retry';
import { Contract } from 'ethers';
import { getDefaultProvider } from '@ethersproject/providers';
import Birthblock from '../birthblock.mjs';

export const BIRTHBLOCK_WEBHOOK_URL = process.env.BIRTHBLOCK_WEBHOOK_URL;
export const EVENT_FORWARDER_AUTH_TOKEN = process.env.EVENT_FORWARDER_AUTH_TOKEN;
export const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
export const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
export const INFURA_ID = process.env.INFURA_ID;
export const NETWORK = process.env.NETWORK.toLowerCase();

export const signMessage = (body) => {
    const hmac = createHmac('sha256', EVENT_FORWARDER_AUTH_TOKEN); // Create a HMAC SHA256 hash using the auth token
    hmac.update(JSON.stringify(body), 'utf8'); // Update the token hash with the request body using utf8
    const digest = hmac.digest('hex');
    return digest;
};

export const fetchBaseOptions = {
    retry: 12,
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

export const fetcher = (url, options) =>
    fetch(url, options).then((r) => {
        const status = r.status;
        if (status !== 200) {
            console.log(r.statusText);
            throw new Error({ error: `${status} ${r.statusText}` });
        } else {
            return r.json();
        }
    });

export function getBirthblockContract(contractAddress = CONTRACT_ADDRESS) {
    const ethersNetworkString = NETWORK == 'ethereum' ? 'homestead' : NETWORK;
    const defaultProvider = getDefaultProvider(ethersNetworkString, {
        alchemy: ALCHEMY_API_KEY,
        infura: INFURA_ID,
    });
    const birthblockContract = new Contract(contractAddress, Birthblock.abi, defaultProvider);
    const blackholeAddress = '0x0000000000000000000000000000000000000000';

    const filter = birthblockContract.filters.Transfer(blackholeAddress);
    return [birthblockContract, filter];
}
