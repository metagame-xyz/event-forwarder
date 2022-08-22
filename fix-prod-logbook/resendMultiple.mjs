import {
    webhookOptions,
    LOGBOOK_WEBHOOK_URL,
    LOGBOOK_CONTRACT_ADDRESS,
    fetcher,
    fetchBaseOptions,
} from '../utils/index.mjs';
import fs from 'fs';

async function main() {
    const addresses = JSON.parse(fs.readFileSync('...'));

    async function runLoop() {
        for (const [key, value] of Object.entries(addresses)) {
            const body = {
                minterAddress: value,
                tokenId: key,
            };

            const result = await fetcher(LOGBOOK_WEBHOOK_URL, webhookOptions(body));

            if (result.error) {
                console.error(result.message);
                console.error(result.error);
            } else {
                console.log(
                    `${result.minterAddress} with   tokenId ${result.tokenId} has been added or updated`,
                );
            }

            const openseaUrl = `https://api.opensea.io/api/v1/asset/${LOGBOOK_CONTRACT_ADDRESS}/${body.tokenId}/?force_update=true`;
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
