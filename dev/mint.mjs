/* eslint-disable no-unused-vars */
import { TOKEN_GARDEN_CONTRACT_ADDRESS } from '../utils/index.mjs';

import { getTokenGardenContract } from '../utils/dev.mjs';

async function main() {
    // const addresses = JSON.parse(fs.readFileSync('./output/addresses.json'));

    const contractAddress = TOKEN_GARDEN_CONTRACT_ADDRESS;
    // const contractAddress = '0xbc96d12EFF9C5D55b31D094EA85d9960088F3beF';

    async function runLoop() {
        const [tokenGardenContract, getSigner] = getTokenGardenContract('rinkeby', contractAddress);

        const promises = [];

        for (let i = 0; i < 10; i++) {
            console.log(`submitting tx ${i} for ${contractAddress}`);
            const tokenGardenContractWritable = tokenGardenContract.connect(getSigner(i));
            const value = 0;
            const promise = tokenGardenContractWritable.mint({ value });
            promises.push(promise);
        }

        const dataArray = await Promise.all(promises);

        for (const data of dataArray) {
            const moreData = await data.wait();
            const [fromAddress, toAddress, tokenId] = moreData.events.find(
                (e) => (e.event = 'Transfer'),
            ).args;
            console.log(`${fromAddress} -> ${toAddress}: ${tokenId}`);
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
