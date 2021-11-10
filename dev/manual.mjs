import fetch from 'node-fetch-retry';
import { createHmac } from 'crypto';
const BIRTHBLOCK_WEBHOOK_URL = process.env.BIRTHBLOCK_WEBHOOK_URL;
const EVENT_FORWARDER_AUTH_TOKEN = process.env.EVENT_FORWARDER_AUTH_TOKEN;

const minterAddress = '0x2e0e3F06289627A0C26Fe84178fbB10adD0e7C4C';
const tokenId = 1;

console.log('BIRTHBLOCK_WEBHOOK_URL:', BIRTHBLOCK_WEBHOOK_URL);

async function main() {
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

    const webhookOptions = (body) => ({
        ...fetchBaseOptions,
        method: 'post',
        body: JSON.stringify(body),
        headers: {
            'content-type': 'application/json',
            'x-event-forwarder-signature': signMessage(body),
        },
    });

    const body = {
        minterAddress,
        tokenId,
    };

    console.log('body:', body);

    const result = await fetcher(BIRTHBLOCK_WEBHOOK_URL, webhookOptions(body));

    console.log('result:', result);

    if (result.error) {
        console.error(result.error);
    } else {
        console.log(
            `${result.minterAddress} with   tokenId ${result.tokenId} has been added or updated`,
        );
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
