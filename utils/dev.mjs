import { Contract } from 'ethers';
import { getDefaultProvider } from '@ethersproject/providers';
import Birthblock from '../birthblock.mjs';

export const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
export const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
export const INFURA_ID = process.env.INFURA_ID;
export const NETWORK = process.env.NETWORK.toLowerCase();

export function getBirthblockContract(contractAddress = CONTRACT_ADDRESS) {
    const ethersNetworkString = NETWORK == 'ethereum' ? 'homestead' : NETWORK;
    const defaultProvider = getDefaultProvider(ethersNetworkString, {
        alchemy: ALCHEMY_API_KEY,
        infura: INFURA_ID,
    });
    const birthblockContract = new Contract(contractAddress, Birthblock.abi, defaultProvider);
    const blackholeAddress = '0x0000000000000000000000000000000000000000';

    const filter = birthblockContract.filters.Transfer(blackholeAddress);
    return [birthblockContract, filter];
}
