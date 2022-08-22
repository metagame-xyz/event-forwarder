import {
    webhookOptions,
    NOMAD_WHITEHAT_WEBHOOK_URL,
    NOMAD_WHITEHAT_CONTRACT_ADDRESS,
    fetcher,
    openseaFetchOptions,
} from '../utils/index.mjs';

const minterAddress = '0x7693c3545667309f112eb2d1a0d7bdfcfc536411';
const tokenId = '1';

async function main() {
    async function runOnce() {
        const body = {
            minterAddress,
            tokenId: tokenId.toString(),
        };

        console.log('body', body);

        const { result } = await fetcher(NOMAD_WHITEHAT_WEBHOOK_URL, webhookOptions(body));

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

        const openseaUrl = `https://api.opensea.io/api/v1/asset/${NOMAD_WHITEHAT_CONTRACT_ADDRESS}/${body.tokenId}/?force_update=true`;
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
