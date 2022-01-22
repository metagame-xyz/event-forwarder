import { webhookOptions, TOKEN_GARDEN_WEBHOOK_URL, fetcher } from '../utils/index.mjs';
import fs from 'fs';

async function main() {
    const addresses = JSON.parse(fs.readFileSync('./manual-fix-2.json'));

    async function runLoop() {
        for (const [key, value] of Object.entries(addresses)) {
            const body = {
                minterAddress: value,
                tokenId: key,
            };

            const { status, message, result } = await fetcher(
                TOKEN_GARDEN_WEBHOOK_URL,
                webhookOptions(body),
            );

            console.log('status:', status);
            console.log('message:', message);

            if (result.error) {
                console.error(result.message);
                console.error(result.error);
            } else {
                console.log(
                    `${result.minterAddress} with   tokenId ${result.tokenId} has been added or updated`,
                );
            }

            await new Promise((resolve) => setTimeout(resolve, 3000));
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
