import {
    webhookOptions,
    LLAMA_PFP_WEBHOOK_URL,
    LLAMA_PFP_CONTRACT_ADDRESS,
    fetcher,
    openseaFetchOptions,
} from '../utils/index.mjs';

const minterAddress = '0x5dc942e89b162631c86361c793f1cc20fb2b15e4';
const tokenId = '2';

async function main() {
    async function runOnce() {
        const body = {
            minterAddress,
            tokenId: tokenId.toString(),
            nftName: 'llamaPfp',
            contractAddress: LLAMA_PFP_CONTRACT_ADDRESS,
        };

        console.log('body', body);

        const { result } = await fetcher(LLAMA_PFP_WEBHOOK_URL, webhookOptions(body));

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

        const openseaUrl = `https://api.opensea.io/api/v1/asset/${LLAMA_PFP_CONTRACT_ADDRESS}/${body.tokenId}/?force_update=true`;
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
