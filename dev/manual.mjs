import { webhookOptions, fetcher } from '../utils/index.mjs';

// const minterAddress = '0xE7b25a8aB435C4f8a0d056EdDA7ba450A9999285';
// const tokenId = 1;

// const minterAddress = '0x5e349eca2dc61aBCd9dD99Ce94d04136151a09Ee';
// const tokenId = 12;

// const minterAddress = '0xd770383C8401dCAEe72829c4202477C6Cb917aE9';
// const tokenId = 40;

// const minterAddress = '0xFb6cf36C7C765E3Ff96e83463b26C9781D2Fdd2d';
// const tokenId = 91;

const minterAddress = '0xF1a9F5AEb0F975489aC2628A22040Cf42E9fE8DD';
const tokenId = 148;

async function main() {
    async function runOnce() {
        const body = {
            minterAddress,
            tokenId,
        };

        console.log('body', body);

        await fetcher(
            'https://tokengarden.loca.lt/api/v1/dev/safe/timerTest',
            webhookOptions(body),
            1,
        );
        // const result = await fetcher(
        //     'https://tokengarden.loca.lt/api/v1/dev/safe/timerTest',
        //     webhookOptions(body),
        // );

        // if (result.error) {
        //     console.error(result.message);
        //     console.error(result.error);
        // } else {
        //     // console.log('result', result);
        //     console.log(
        //         `${result.minterAddress} with   tokenId ${result.tokenId} has been added or updated`,
        //     );
        // }
    }

    await runOnce();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
