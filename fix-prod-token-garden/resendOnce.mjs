import { webhookOptions, TOKEN_GARDEN_WEBHOOK_URL, fetcher } from '../utils/index.mjs';

const body = {
    minterAddress: '0x739aa3133dfa870a6fcc5ff35aeee47dd7028a24',
    tokenId: '505',
    forceScreenshot: true,
};

// 0x90b56d0e27e74c3c5e66ebfcaf12dc5ecf0665dd
// 438

async function main() {
    async function runOnce() {
        console.log('body', body);

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
