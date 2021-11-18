import {
    getBirthblockContract,
    webhookOptions,
    BIRTHBLOCK_WEBHOOK_URL,
    fetcher,
    fetchBaseOptions,
    CONTRACT_ADDRESS,
} from '../utils/index.mjs';
import { WebClient } from '@slack/web-api';

// An access token (from your Slack app or custom integration - xoxp, xoxb)


// This argument can be a channel ID, a DM ID, a MPDM ID, or a group ID
const conversationId = 'C02M123F48N';

async function main() {
    const web = new WebClient(token);

    const minterAddress = '0xd9f9ab9092e69a36c4c02f8e6797abf0c7e2ced5';
    const tokenId = 443;
    const ensName = 'null';

    // const { minterAddress, tokenId, ensName } = result;
    const userName = ensName || minterAddress;
    const text = `${userName} just minted #${tokenId} https://opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId}`;

    try {
        await web.chat.postMessage({ channel: conversationId, text });
    } catch (e) {
        console.log(e);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
