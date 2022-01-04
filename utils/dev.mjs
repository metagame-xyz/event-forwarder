import { Contract, Wallet, utils } from 'ethers';
import { getDefaultProvider } from '@ethersproject/providers';
import Birthblock from '../birthblock.mjs';

export const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
export const INFURA_ID = process.env.INFURA_ID;
export const NETWORK = process.env.NETWORK.toLowerCase();
export const MNEMONIC = process.env.MNEMONIC;

export const BIRTHBLOCK_MAINNET_ADDRESS = '0x2Ba797C234C8fE25847225B11b616bCE729B0B53';

export function getBirthblockContract(network = NETWORK, contractAddress) {
    const ethersNetworkString = network == 'ethereum' ? 'homestead' : network;
    const defaultProvider = getDefaultProvider(ethersNetworkString, {
        alchemy: ALCHEMY_API_KEY,
        infura: INFURA_ID,
    });
    const birthblockContract = new Contract(contractAddress, Birthblock.abi, defaultProvider);
    const blackholeAddress = '0x0000000000000000000000000000000000000000';

    const filter = birthblockContract.filters.Transfer(blackholeAddress);
    return [birthblockContract, filter];
}

export function getTokenGardenContract(network = NETWORK, contractAddress) {
    const ethersNetworkString = network == 'ethereum' ? 'homestead' : network;
    const defaultProvider = getDefaultProvider(ethersNetworkString, {
        alchemy: ALCHEMY_API_KEY,
        infura: INFURA_ID,
    });
    const tokenGardenContract = new Contract(contractAddress, Birthblock.abi, defaultProvider);
    // const blackholeAddress = '0x0000000000000000000000000000000000000000';

    // const filter = tokenGardenContract.filters.Transfer(blackholeAddress);

    function getSigner(accountNumber) {
        const account = utils.HDNode.fromMnemonic(MNEMONIC).derivePath(
            `m/44'/60'/0'/0/${accountNumber}`,
        );
        const signer = new Wallet(account, defaultProvider);
        return signer;
    }
    return [tokenGardenContract, getSigner];
}
