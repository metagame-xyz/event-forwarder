/* eslint-disable no-unused-vars */
import { createAlchemyWeb3 } from '@alch/alchemy-web3';
import { WebClient } from '@slack/web-api';

import {
    webhookOptions,
    fetcher,
    fetchBaseOptions,
    SLACK_API_TOKEN,
    conversationId,
    openseaForceUpdateURL,
    FetcherError,
    networkStrings,
    ALCHEMY_API_KEY,
    getContractAbi,
    blackholeAddress,
    newMintString,
    BIRTHBLOCK_CONTRACT_ADDRESS,
    BIRTHBLOCK_WEBHOOK_URL,
    TOKEN_GARDEN_CONTRACT_ADDRESS,
    TOKEN_GARDEN_WEBHOOK_URL,
    alchemyUpdateWebhookAddressesURL,
    notifyOptions,
    AddAddressToTokenGardenListener,
} from './utils/index.mjs';

const web3 = createAlchemyWeb3(
    `wss://${networkStrings.alchemy}alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
);

const slackClient = new WebClient(SLACK_API_TOKEN);

async function slack(text) {
    return await slackClient.chat.postMessage({
        channel: conversationId,
        text,
    });
}

const contracts = [
    {
        nftName: 'BirthBlock',
        contractAddress: BIRTHBLOCK_CONTRACT_ADDRESS,
        webhookURL: BIRTHBLOCK_WEBHOOK_URL,
    },
    {
        nftName: 'Token Garden',
        contractAddress: TOKEN_GARDEN_CONTRACT_ADDRESS,
        webhookURL: TOKEN_GARDEN_WEBHOOK_URL,
    },
];

// eslint-disable-next-line no-unused-vars
for (const contractData of contracts) {
    const { nftName, contractAddress, webhookURL } = contractData;

    const { status, result: contractAbi } = await getContractAbi(contractAddress);

    if (status !== '1') {
        console.error(`getContractAbi Error: ${contractAbi}`);
        process.exit(1);
    }

    const contract = new web3.eth.Contract(JSON.parse(contractAbi), contractAddress);

    console.log(
        `listening on https://${networkStrings.etherscan}etherscan.io/address/${contractAddress} : ${webhookURL}`,
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

            console.log(`${body.minterAddress} minted tokenId ${body.tokenId} for ${nftName}`);

            let status, result; // could also pull out 'message'

            /* Send data to service */
            try {
                ({ status, result } = await fetcher(webhookURL, webhookOptions(body)));
            } catch (error) {
                if (error instanceof FetcherError) {
                    // do nothing - FetcherError gets logged by fetcher
                } else {
                    console.error(`unkown error ${nftName}: ${error.name} ${error.message}`);
                }
            }

            if (nftName === 'Token Garden') {
                let alchemyData = 'ok so its nothing?';
                try {
                    alchemyData = await fetcher(
                        alchemyUpdateWebhookAddressesURL,
                        notifyOptions(AddAddressToTokenGardenListener(body.minterAddress)),
                    );
                } catch (error) {
                    console.log(
                        `Alchemy notify error: ${body.minterAddress} for token id ${body.tokenId}`,
                    );
                    console.log(error);
                }
            }

            /* If no error from service, force update Opensea and send Slack message */
            if (status == 1) {
                const { minterAddress, tokenId, ensName } = result;
                const userName = ensName || minterAddress.substr(0, 6);
                console.log(
                    `${minterAddress} with   tokenId ${tokenId} has been added or updated for ${nftName}`,
                );

                // opensea force update happens in the queued job for Token Garden
                if (nftName === 'BirthBlock') {
                    try {
                        const { permalink } = await fetcher(
                            openseaForceUpdateURL(tokenId, contractAddress),
                            fetchBaseOptions,
                        );
                        console.log(permalink);
                    } catch (error) {
                        if (error instanceof FetcherError) {
                            await slack(`Metadata force update failed: ${error.url}`);
                        } else {
                            console.error(
                                `unkown error ${nftName}: ${error.name} ${error.message}`,
                            );
                        }
                    }
                }

                try {
                    await slack(newMintString(userName, tokenId, nftName, contractAddress));
                } catch (error) {
                    console.error(`unkown error ${nftName}: ${error.name} ${error.message}`);
                }
            }
        })
        .on('error', (error) => {
            console.log('error:', error);
        })
        .on('end', () => console.log('connectnion ended'));
}
