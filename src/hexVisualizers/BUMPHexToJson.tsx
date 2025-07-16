import { convertEndianness, parseLittleEndianInteger, parseVariableSizeInteger } from "./helpers";

const TREE_HEIGHT_SIZE_IN_BYTES = 1;
const LEAF_FLAG_SIZE_IN_BYTES = 1;
const HASH_SIZE_IN_BYTES = 32;
const VARINT_SIZE_UPPERBOUND_IN_BYTES = 9;


export interface BUMPJsonObject {
    blockHeight: number; 
    treeHeight: number;
    levels: BUMPLevel[];
}

interface BUMPLevel {
    nLeaves: number;
    leaves: BUMPLeaf[];
}

interface BUMPLeaf {
    offset: number; 
    flag: BumpLeafFlag;
    hash?: string;
}

enum BumpLeafFlag {
    nonClient = '00:non-client',
    duplicate = '01:duplicate',
    client = '02:client'
}

export function BUMPHexToJson(rawBUMPHex: string): [BUMPJsonObject, string] {
    const cleanHex = rawBUMPHex.startsWith("0x") || rawBUMPHex.startsWith("0X") ? rawBUMPHex.slice(2) : rawBUMPHex;

    const hexRegex = /^(0x|0X)?[0-9a-fA-F]+$/;
    if (!hexRegex.test(cleanHex) || cleanHex.length % 2 == 1) {
        throw Error("Input string must be a valid hex string.")
    }

    const BUMPJson : BUMPJsonObject = {
        blockHeight: 0,
        treeHeight: 0,
        levels: []
    }

    let begin = 0, end = 0;

    // 1. blockHeight: variable-length integer
    let blockHeight: number, actualSize: number
    [blockHeight , actualSize] = parseVariableSizeInteger(cleanHex.slice(begin, begin + VARINT_SIZE_UPPERBOUND_IN_BYTES * 2))
    begin += actualSize
    BUMPJson['blockHeight'] = blockHeight

    // 2. tree height: 1-byte integer
    end = begin + TREE_HEIGHT_SIZE_IN_BYTES * 2
    const treeHeight = parseLittleEndianInteger(cleanHex.slice(begin, end)); begin = end;
    BUMPJson['treeHeight'] = treeHeight

    for (let i = 0; i < treeHeight; i++) {
        const levelJson : BUMPLevel = {
            nLeaves: 0,
            leaves: []
        }
        // 3. level nLeaves: variable-length integer
        let nLeaves: number, actualSize: number
        [nLeaves , actualSize] = parseVariableSizeInteger(cleanHex.slice(begin, begin + VARINT_SIZE_UPPERBOUND_IN_BYTES * 2))
        begin += actualSize
        levelJson['nLeaves'] = nLeaves

        for (let j: number = 0; j < nLeaves; j++) {
            // 4. leaf offset: variable-length integer
            let offset: number, actualSize: number
            [offset , actualSize] = parseVariableSizeInteger(cleanHex.slice(begin, begin + VARINT_SIZE_UPPERBOUND_IN_BYTES * 2))
            begin += actualSize

            // 5. leaf flag: 1-byte 00 or 01 or 02
            end = begin + LEAF_FLAG_SIZE_IN_BYTES * 2
            const flagHex = cleanHex.slice(begin, end); begin = end;
            let flag : BumpLeafFlag;
            let hash : string | undefined = undefined;
            if (flagHex === '00') {
                flag = BumpLeafFlag.nonClient
                // 6. leaf hash: 0 or 32-byte string (little endian)
                end = begin + HASH_SIZE_IN_BYTES * 2
                hash = convertEndianness(cleanHex.slice(begin, end)); begin = end;

            } else if (flagHex === '01') {
                flag = BumpLeafFlag.duplicate

            } else if (flagHex === '02') {
                flag = BumpLeafFlag.client
                // 6. leaf hash: 0 or 32-byte string (little endian)
                end = begin + HASH_SIZE_IN_BYTES * 2
                hash = convertEndianness(cleanHex.slice(begin, end)); begin = end;

            } else {
                throw Error('Unkonwn leaf flag.')
            }

            const leafJson : BUMPLeaf = {
                offset: offset,
                flag: flag,
                hash: hash
            }

            levelJson['leaves'].push(leafJson)
        }
        BUMPJson['levels'].push(levelJson)
    }

    return [BUMPJson, cleanHex.slice(begin)]

}