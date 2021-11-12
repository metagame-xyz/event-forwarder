import {
    getBirthblockContract,
    webhookOptions,
    BIRTHBLOCK_WEBHOOK_URL,
    CONTRACT_ADDRESS,
    fetcher,
    fetchBaseOptions,
} from '../utils/index.mjs';
// const minterAddress = '0x001cF1FAa42b18021c90A29e622e83fffE2Be6ce';
// const tokenId = 341;

const tuples = [['0xEeFC49b3247b605441B8c6Ca541d3769A77ea3d7', 407]];

async function main() {
    const [birthblockContract, filter] = getBirthblockContract();

    let events;
    try {
        events = await birthblockContract.queryFilter(filter);
    } catch (error) {
        console.log('events error');
        console.log(error);
    }

    async function runOnce() {
        const body = {
            minterAddress,
            tokenId,
        };

        console.log('body', body);

        const result = await fetcher(BIRTHBLOCK_WEBHOOK_URL, webhookOptions(body));

        if (result.error) {
            console.error(result.message);
            console.error(result.error);
        } else {
            // console.log('result', result);
            console.log(
                `${result.minterAddress} with   tokenId ${result.tokenId} has been added or updated`,
            );
        }
    }

    async function runLoop() {
        for (let i = 0; i < tuples.length; i++) {
            const body = {
                minterAddress: tuples[i][0],
                tokenId: tuples[i][1],
            };

            const result = await fetcher(BIRTHBLOCK_WEBHOOK_URL, webhookOptions(body));

            if (result.error) {
                console.error(result.message);
                console.error(result.error);
            } else {
                console.log(
                    `${result.minterAddress} with   tokenId ${result.tokenId} has been added or updated`,
                );
            }

            const openseaUrl = `https://api.opensea.io/api/v1/asset/${CONTRACT_ADDRESS}/${body.tokenId}/?force_update=true`;
            const openseaResult = await fetcher(openseaUrl, fetchBaseOptions);
            if (openseaResult.error) {
                console.error(result.error);
            }
        }
    }

    // await runOnce();
    await runLoop();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });