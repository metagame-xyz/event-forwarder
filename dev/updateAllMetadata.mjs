import {
    webhookOptions,
    BIRTHBLOCK_WEBHOOK_URL,
    fetcher,
    fetchBaseOptions,
} from '../utils/index.mjs';

import { getBirthblockContract } from '../utils/dev.mjs';

async function main() {
    const [birthblockContract, filter] = getBirthblockContract();

    let events;
    try {
        events = await birthblockContract.queryFilter(filter);
    } catch (error) {
        console.log('events error');
        console.log(error);
    }

    const tuples = [];

    for (let i = 441; i < 443; i++) {
        const address = events[i].args[1];
        const tokenId = events[i].args[2].toNumber();
        console.log(`address: ${address} tokenId: ${tokenId}`);

        tuples.push([address, tokenId]);
        // console.log(events[i]);
    }

    async function runLoop() {
        for (let i = 0; i < tuples.length; i++) {
            const body = {
                minterAddress: tuples[i][0],
                tokenId: tuples[i][1],
            };

            let result;
            try {
                result = await fetcher(BIRTHBLOCK_WEBHOOK_URL, webhookOptions(body));
            } catch (error) {
                console.log(error.error);
            }

            if (result.error) {
                console.error('message:', result.message);
                console.error('error:', result.error);
            } else {
                if (result.minterAddress) {
                    console.log(
                        `${result.minterAddress} with   tokenId ${result.tokenId} has been added or updated`,
                    );
                }
            }

            const openseaUrl = `https://api.opensea.io/api/v1/asset/${CONTRACT_ADDRESS}/${body.tokenId}/?force_update=true`;
            const openseaResult = await fetcher(openseaUrl, fetchBaseOptions);
            if (openseaResult.error) {
                console.error(result.error);
            }
        }
    }

    await runLoop();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
