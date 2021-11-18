import { createAlchemyWeb3 } from '@alch/alchemy-web3';
import { WebClient } from '@slack/web-api';

import {
    webhookOptions,
    BIRTHBLOCK_WEBHOOK_URL,
    fetcher,
    fetchBaseOptions,
    CONTRACT_ADDRESS,
    SLACK_API_TOKEN,
    conversationId,
    openseaForceUpdateURL,
    FetcherError,
    networkStrings,
    ALCHEMY_API_KEY,
    ETHERSCAN_API_KEY,
    blackholeAddress,
} from './utils/index.mjs';

const web3 = createAlchemyWeb3(
    `wss://${networkStrings.alchemy}alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
);

const slackClient = new WebClient(SLACK_API_TOKEN);

function slackText(userName, tokenId) {
    return `${userName} just minted #${tokenId} https://${networkStrings.opensea}opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId}`;
}

const getContractAbi = async (contractAddress) =>
    await fetcher(
        `https://${networkStrings.etherscanAPI}etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`,
        fetchBaseOptions,
    );

const { status, result: contractAbi } = await getContractAbi(CONTRACT_ADDRESS);

if (status !== '1') {
    console.error(`getContractAbi Error: ${contractAbi}`);
    process.exit(1);
}

const contract = new web3.eth.Contract(JSON.parse(contractAbi), CONTRACT_ADDRESS);

console.log(
    `listening on https://${networkStrings.etherscan}etherscan.io/address/${CONTRACT_ADDRESS}`,
);

contract.events
    .Transfer({
        filter: { from: blackholeAddress },
    })
    .on('data', async (event) => {
        console.log('Event!');
        const body = {
            minterAddress: event.returnValues[1],
            tokenId: event.returnValues[2],
        };

        console.log(`${body.minterAddress} minted tokenId ${body.tokenId}`);

        let status, result; // could also pull out 'message'

        /* Send data to birthblock service */
        try {
            ({ status, result } = await fetcher(BIRTHBLOCK_WEBHOOK_URL, webhookOptions(body)));
        } catch (error) {
            if (error instanceof FetcherError) {
                // do nothing - FetcherError gets logged by fetcher
            } else {
                console.error(`unkown error: ${error.name} ${error.message}`);
            }
        }

        /* If no error from birthblock service, force update Opensea and send Slack message */
        if (status == 1) {
            const { minterAddress, tokenId, ensName } = result;
            const userName = ensName || minterAddress.substr(0, 6);
            console.log(`${minterAddress} with   tokenId ${tokenId} has been added or updated`);

            try {
                await fetcher(openseaForceUpdateURL(tokenId), fetchBaseOptions);
            } catch (error) {
                if (error instanceof FetcherError) {
                    // do nothing - FetcherError gets logged by fetcher
                } else {
                    console.error(`unkown error: ${error.name} ${error.message}`);
                }
            }

            try {
                await slackClient.chat.postMessage({
                    channel: conversationId,
                    text: slackText(userName, tokenId),
                });
            } catch (error) {
                console.error(`unkown error: ${error.name} ${error.message}`);
            }
        }
    })
    .on('error', (error) => {
        console.log('error:', error);
    })
    .on('end', () => console.log('connectnion ended'));
