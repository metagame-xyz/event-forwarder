import {
    webhookOptions,
    BIRTHBLOCK_WEBHOOK_URL,
    BIRTHBLOCK_CONTRACT_ADDRESS,
    fetcher,
    openseaFetchOptions,
} from '../utils/index.mjs';

const minterAddress = '0x50d7f6eb6beebe888556a124324a1420652c96ac';
const tokenId = '1397';

async function main() {
    async function runOnce() {
        const body = {
            minterAddress,
            tokenId: tokenId.toString(),
        };

        console.log('body', body);

        const result = await fetcher(BIRTHBLOCK_WEBHOOK_URL, webhookOptions(body));

        if (result.error) {
            console.error(result.message);
            console.error(result.error);
        } else {
            // console.log('result', result);
            console.log(
                `${result.minterAddress} with   tokenId ${result.tokenId} has been added or updated`,
            );
        }

        const openseaUrl = `https://api.opensea.io/api/v1/asset/${BIRTHBLOCK_CONTRACT_ADDRESS}/${body.tokenId}/?force_update=true`;
        const openseaResult = await fetcher(openseaUrl, openseaFetchOptions);
        if (openseaResult.error) {
            console.error(result.error);
        }
    }

    await runOnce();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
