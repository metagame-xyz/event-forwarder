import { webhookOptions, TOKEN_GARDEN_WEBHOOK_URL, fetcher } from '../utils/index.mjs';

const minterAddress = 'xxx';
const tokenId = 0;

async function main() {
    async function runOnce() {
        const body = {
            minterAddress,
            tokenId,
        };

        console.log('body', body);

        const result = await fetcher(TOKEN_GARDEN_WEBHOOK_URL, webhookOptions(body));

        if (result.error) {
            console.error(result.message);
            console.error(result.error);
        } else {
            // console.log('result', result);
            console.log(
                `${result.minterAddress} with   tokenId ${result.tokenId} has been added or updated`,
            );
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
