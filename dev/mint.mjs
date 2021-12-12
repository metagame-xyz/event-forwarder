import {
    webhookOptions,
    TOKEN_GARDEN_WEBHOOK_URL,
    TOKEN_GARDEN_CONTRACT_ADDRESS,
    fetcher,
    fetchBaseOptions,
    sleep,
} from '../utils/index.mjs';
import fs from 'fs';

import { getTokenGardenContract } from '../utils/dev.mjs';

async function main() {
    // const addresses = JSON.parse(fs.readFileSync('./output/addresses.json'));

    async function runLoop() {
        const [tokenGardenContract, getSigner] = getTokenGardenContract(
            'rinkeby',
            TOKEN_GARDEN_CONTRACT_ADDRESS,
        );

        const promises = [];

        for (let i = 0; i < 10; i++) {
            const tokenGardenContractWritable = tokenGardenContract.connect(getSigner(i));
            const value = 0;
            const promise = tokenGardenContractWritable.mint({ value });
            promises.push(promise);
        }

        const dataArray = await Promise.all(promises);

        for (const data of dataArray) {
            const moreData = await data.wait();
            console.log(moreData);
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
