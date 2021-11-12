import {
    getBirthblockContract,
    webhookOptions,
    BIRTHBLOCK_WEBHOOK_URL,
    fetcher,
    fetchBaseOptions,
} from '../utils/index.mjs';

async function main() {

    const [birthblockContract, filter] = getBirthblockContract();

    let events;
    try {
        events = await birthblockContract.queryFilter(filter);
    } catch (error) {
        console.log('events error');
        console.log(error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
