import {
    TOKEN_GARDEN_CONTRACT_ADDRESS,
    fetcher,
    fetchBaseOptions,
    sleep,
} from '../utils/index.mjs';

async function main() {
    async function runLoop() {
        for (let i = 90; i >= 1; i--) {
            console.log(`updating metadata for ${i}`);
            const openseaUrl = `https://api.opensea.io/api/v1/asset/${TOKEN_GARDEN_CONTRACT_ADDRESS}/${i}/?force_update=true`;
            const openseaResult = await fetcher(openseaUrl, fetchBaseOptions);
            console.log(openseaResult.image_url);
            if (openseaResult.error) {
                console.error(openseaResult);
            }
            await sleep(1_000);
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
