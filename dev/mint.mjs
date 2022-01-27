/* eslint-disable no-unused-vars */
import { TOKEN_GARDEN_CONTRACT_ADDRESS } from '../utils/index.mjs';

import { getTokenGardenContract } from '../utils/dev.mjs';

async function main() {
    // const addresses = JSON.parse(fs.readFileSync('./output/addresses.json'));

    // const contractAddress = TOKEN_GARDEN_CONTRACT_ADDRESS;
    // const contractAddress = '0xbc96d12eff9c5d55b31d094ea85d9960088f3bef'; // old token garden
    // const contractAddress = '0xbc96d12EFF9C5D55b31D094EA85d9960088F3beF';

    const contractAddress = '0xbC37a38D7647BEe80d23b296fF61f737C574126E'; // heartbeat rinkeby

    async function runLoop() {
        const [tokenGardenContract, getSigner] = getTokenGardenContract('rinkeby', contractAddress);

        const promises = [];

        // only wallets 0-9 have eth in them

        for (let i = 0; i < 9; i++) {
            console.log(`submitting tx ${i} for ${contractAddress} from ${getSigner(0).address}`);
            const tokenGardenContractWritable = tokenGardenContract.connect(getSigner(i));
            const value = 0;
            const promise = await tokenGardenContractWritable.mint({ value });
            console.log(`tx ${i} submitted`);
            // const moreData = await promise.wait();
            // const [fromAddress, toAddress, tokenId] = moreData.events.find(
            //     (e) => (e.event = 'Transfer'),
            // ).args;
            // console.log(`${fromAddress} -> ${toAddress}: ${tokenId}`);
        }
        // promises.push(promise);
    }

    // const dataArray = await Promise.all(promises);

    // for (const data of dataArray) {
    //     const moreData = await data.wait();
    //     const [fromAddress, toAddress, tokenId] = moreData.events.find(
    //         (e) => (e.event = 'Transfer'),
    //     ).args;
    //     console.log(`${fromAddress} -> ${toAddress}: ${tokenId}`);
    // }
    // }

    await runLoop();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
