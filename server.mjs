/* eslint-disable no-unused-vars */
import { createAlchemyWeb3 } from '@alch/alchemy-web3';
import { WebClient } from '@slack/web-api';

import {
    webhookOptions,
    fetcher,
    openseaFetchOptions,
    SLACK_API_TOKEN,
    channelId,
    openseaForceUpdateURL,
    networkStrings,
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
    HEARTBEAT_CONTRACT_ADDRESS,
    HEARTBEAT_WEBHOOK_URL,
    LOGBOOK_CONTRACT_ADDRESS,
    LOGBOOK_WEBHOOK_URL,
    NOMAD_WHITEHAT_CONTRACT_ADDRESS,
    NOMAD_WHITEHAT_WEBHOOK_URL,
    LLAMA_PFP_CONTRACT_ADDRESS,
    LLAMA_PFP_WEBHOOK_URL,
    ROBO_NOVA_CONTRACT_ADDRESS,
    ROBO_NOVA_WEBHOOK_URL,
    CDMX_AXOLOTLS_CONTRACT_ADDRESS,
    AVATAR_STUDIO_WEBHOOK_URL,
    VANDERBILT_CONTRACT_ADDRESS,
    sleep,
    NETWORK,
    networkNames,
    alchemyWebsocketRrcUrl,
} from './utils/index.mjs';

import { logError, logSuccess } from './utils/logging.mjs';

const web3 = createAlchemyWeb3(alchemyWebsocketRrcUrl);

const slackClient = new WebClient(SLACK_API_TOKEN);

async function slack(text) {
    return await slackClient.chat.postMessage({
        channel: channelId,
        text,
    });
}

const contracts = [
    {
        nftName: 'BirthBlock',
        contractAddress: BIRTHBLOCK_CONTRACT_ADDRESS,
        webhookURL: BIRTHBLOCK_WEBHOOK_URL,
        testNetwork: networkNames.rinkeby,
    },
    {
        nftName: 'Token Garden',
        contractAddress: TOKEN_GARDEN_CONTRACT_ADDRESS,
        webhookURL: TOKEN_GARDEN_WEBHOOK_URL,
        testNetwork: networkNames.rinkeby,
    },
    {
        nftName: 'Heartbeat',
        contractAddress: HEARTBEAT_CONTRACT_ADDRESS,
        webhookURL: HEARTBEAT_WEBHOOK_URL,
        testNetwork: networkNames.rinkeby,
    },
    {
        nftName: 'Logbook',
        contractAddress: LOGBOOK_CONTRACT_ADDRESS,
        webhookURL: LOGBOOK_WEBHOOK_URL,
        testNetwork: networkNames.rinkeby,
    },
    {
        nftName: 'Nomad whitehat',
        contractAddress: NOMAD_WHITEHAT_CONTRACT_ADDRESS,
        webhookURL: NOMAD_WHITEHAT_WEBHOOK_URL,
        testNetwork: networkNames.rinkeby,
    },
    {
        nftName: 'llamaPfp',
        contractAddress: LLAMA_PFP_CONTRACT_ADDRESS,
        webhookURL: LLAMA_PFP_WEBHOOK_URL,
        testNetwork: networkNames.sepolia,
    },
    // {
    //     nftName: 'robo-nova',
    //     contractAddress: ROBO_NOVA_CONTRACT_ADDRESS,
    //     webhookURL: ROBO_NOVA_WEBHOOK_URL,
    //     testNetwork: networkNames.sepolia,
    // },
    // {
    //     nftName: 'cdmx-axolotls',
    //     contractAddress: CDMX_AXOLOTLS_CONTRACT_ADDRESS,
    //     webhookURL: AVATAR_STUDIO_WEBHOOK_URL,
    //     testNetwork: networkNames.sepolia,
    // },
    {
        nftName: 'commodore', // project slug
        contractAddress: VANDERBILT_CONTRACT_ADDRESS,
        webhookURL: AVATAR_STUDIO_WEBHOOK_URL,
        testNetwork: networkNames.sepolia,
    },
];

// eslint-disable-next-line no-unused-vars
for (const contractData of contracts) {
    const { nftName, contractAddress, webhookURL, testNetwork } = contractData;

    console.log(`Starting ${nftName} listener... network: ${NETWORK}, testNetwork: ${testNetwork}`);

    // sorry Rinkeby you're over
    if (NETWORK === networkNames.ethereum || NETWORK === testNetwork) {
        let status;
        let contractAbi;
        try {
            ({ status, result: contractAbi } = await getContractAbi(contractAddress));

            await sleep(500);
        } catch (error) {
            console.log(`contract: ${nftName}`, error);
            logError(error);
        }

        if (status !== '1') {
            console.error(`getContractAbi Error: ${contractAbi}`);
            process.exit(1);
        }

        const contract = new web3.eth.Contract(JSON.parse(contractAbi), contractAddress);

        const logData = {
            level: 'info',
            function_name: `setUpListenerFor${nftName}`,
            contract_address: contractAddress,
        };

        console.log(
            `listening on https://${networkStrings.etherscan}etherscan.io/address/${contractAddress} : ${webhookURL}`,
        );

        logSuccess(
            logData,
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
                    contractAddress,
                    nftName,
                };

                const logData = {
                    level: 'info',
                    function_name: `${nftName}Mint`,
                    nft_name: nftName,
                    contract_address: contractAddress,
                    wallet_address: body.minterAddress,
                    token_id: body.tokenId,
                };
                const message = `${body.minterAddress} minted tokenId ${body.tokenId} for ${nftName}`;
                logSuccess(logData, message);

                let status, result; // could also pull out 'message'

                /* Send data to service */
                try {
                    ({ status, result } = await fetcher(webhookURL, webhookOptions(body)));
                    if (nftName === 'Token Garden') {
                        let alchemyData = 'ok so its nothing?';

                        alchemyData = await fetcher(
                            alchemyUpdateWebhookAddressesURL,
                            notifyOptions(AddAddressToTokenGardenListener(body.minterAddress)),
                        );
                    }
                    /* If no error from service, force update Opensea and send Slack message */
                    if (status == 1) {
                        const { minterAddress, tokenId, ensName } = result;
                        const userName = ensName || minterAddress.substr(0, 6);
                        console.log(
                            `${minterAddress} with   tokenId ${tokenId} has been added or updated for ${nftName}`,
                        );

                        await slack(newMintString(userName, tokenId, nftName, contractAddress));

                        // opensea force update happens in the queued job for Token Garden & Heartbeat
                        if (nftName !== 'Token Garden' && nftName !== 'Heartbeat') {
                            const { permalink } = await fetcher(
                                openseaForceUpdateURL(tokenId, contractAddress),
                                openseaFetchOptions,
                                4, // max retries, 16s
                            );
                            console.log(permalink);
                        }
                    }
                } catch (error) {
                    logError(logData, error);
                }
            })
            .on('error', (error) => {
                logError(logData, error);
            })
            .on('end', () => console.log('connection ended'));
    }
}
