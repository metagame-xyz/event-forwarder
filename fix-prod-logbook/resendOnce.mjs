import {
    webhookOptions,
    LOGBOOK_WEBHOOK_URL,
    LOGBOOK_CONTRACT_ADDRESS,
    fetcher,
    openseaFetchOptions,
} from '../utils/index.mjs';

const minterAddress = '0xe332de3c84c305698675a73f366061941c78e3b4';
const tokenId = '182';

async function main() {
    async function runOnce() {
        const body = {
            minterAddress,
            tokenId: tokenId.toString(),
        };

        console.log('body', body);

        const { result } = await fetcher(LOGBOOK_WEBHOOK_URL, webhookOptions(body));

        console.log(result);

        if (result.error) {
            console.error(result.message);
            console.error(result.error);
        } else {
            // console.log('result', result);
            console.log(
                `${result.minterAddress} with   tokenId ${result.tokenId} has been added or updated`,
            );
        }

        const openseaUrl = `https://api.opensea.io/api/v1/asset/${LOGBOOK_CONTRACT_ADDRESS}/${body.tokenId}/?force_update=true`;
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
