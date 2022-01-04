import {
    webhookOptions,
    BIRTHBLOCK_WEBHOOK_URL,
    BIRTHBLOCK_CONTRACT_ADDRESS,
    fetcher,
    fetchBaseOptions,
} from '../utils/index.mjs';

const minterAddress = '0xF0f449f4E8D94D0e64de385D7c32a1F61B749DD3';
const tokenId = 12;

async function main() {
    async function runOnce() {
        const body = {
            minterAddress,
            tokenId,
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
        const openseaResult = await fetcher(openseaUrl, fetchBaseOptions);
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
