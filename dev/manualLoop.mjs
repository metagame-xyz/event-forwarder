import { webhookOptions, HEARTBEAT_WEBHOOK_URL, fetcher, sleep } from '../utils/index.mjs';
import fs from 'fs';

// const minterAddress = '0x001cF1FAa42b18021c90A29e622e83fffE2Be6ce';
// const tokenId = 341;

async function main() {
    const addresses = JSON.parse(fs.readFileSync('./output/addresses.json'));

    async function runLoop() {
        const tuples = Object.entries(addresses);
        for (let i = 0; i < 1; i++) {
            const [tokenId, minterAddress] = tuples[i];

            const body = {
                minterAddress,
                tokenId,
            };

            console.log(body);

            const { result } = await fetcher(HEARTBEAT_WEBHOOK_URL, webhookOptions(body));

            if (result.error) {
                console.error(result.message);
                console.error(result.error);
            } else {
                console.log(
                    `${result.minterAddress} with   tokenId ${result.tokenId} has been added or updated`,
                );
            }
            await sleep(1000);
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
