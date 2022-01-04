import // webhookOptions,
// BIRTHBLOCK_WEBHOOK_URL,
// fetcher,
// fetchBaseOptions,
'../utils/index.mjs';
import fs from 'fs';

import { getBirthblockContract, BIRTHBLOCK_MAINNET_ADDRESS } from '../utils/dev.mjs';

const TOTAL_TO_GRAB = 100;

async function main() {
    const [birthblockContract, filter] = getBirthblockContract(
        'ethereum',
        BIRTHBLOCK_MAINNET_ADDRESS,
    );

    let events;
    try {
        events = await birthblockContract.queryFilter(filter);
        console.log(`Found ${events.length} events`);
    } catch (error) {
        console.log('events error');
        console.log(error);
    }

    const addresses = {};

    for (let i = 0; i < TOTAL_TO_GRAB; i++) {
        const address = events[i].args[1];
        const tokenId = events[i].args[2].toNumber();
        console.log(`address: ${address} tokenId: ${tokenId}`);
        addresses[tokenId] = address;
        // console.log(events[i]);
    }

    fs.writeFileSync('./output/addresses.json', JSON.stringify(addresses));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
