import {
    TOKEN_GARDEN_CONTRACT_ADDRESS,
    fetcher,
    openseaFetchOptions,
    sleep,
} from '../utils/index.mjs';

async function main() {
    async function runLoop() {
        for (let i = 423; i <= 437; i++) {
            const openseaForceUpdateURL = `https://api.opensea.io/api/v1/asset/${TOKEN_GARDEN_CONTRACT_ADDRESS}/${i}/?force_update=true`;
            const getNftInfoURL = `https://api.opensea.io/api/v1/asset/${TOKEN_GARDEN_CONTRACT_ADDRESS}/${i}`;

            console.log(`checking metadata for ${i}`);

            const openseaResult = await fetcher(getNftInfoURL, openseaFetchOptions);

            // console.log(openseaResult);

            const originalImageURL = openseaResult.image_original_url;
            if (!(originalImageURL || '').includes('ipfs.io')) {
                console.log(`no ipfs url found for ${i}: ${originalImageURL}`);
                console.log(`updating metadata for ${i}`);
                const forceResult = await fetcher(openseaForceUpdateURL, openseaFetchOptions);
                if (forceResult.error) {
                    console.log(forceResult);
                }
            }
            if (openseaResult.error) {
                console.error(openseaResult);
            }
            await sleep(300);
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
