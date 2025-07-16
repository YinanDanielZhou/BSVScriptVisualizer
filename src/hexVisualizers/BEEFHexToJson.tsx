import { BUMPHexToJson, BUMPJsonObject } from "./BUMPHexToJson";
import { rawTxHexToJson, TxHexJsonObject } from "./rawTxToJson";
import { convertEndianness, parseLittleEndianInteger, parseVariableSizeInteger } from "./helpers";


const ATOMIC_BEEF_PREFIX = "01010101";
const VERSION_NUMBER_SIZE_IN_BYTES = 4;
const TXID_SIZE_IN_BYTES = 32;
const VARINT_SIZE_UPPERBOUND_IN_BYTES = 9;



export interface BEEFJsonObject {
    version: string; 
    atomicSubjectTxid?: string;
    BUMPsCount: number;
    BUMPs: BUMPJsonObject[];
    txCount: number;
    txns: TxWithBUMPV1[] | TxWithBUMPV2[];
}

interface TxWithBUMPV1 {
    transaction: TxHexJsonObject;
    hasBUMP: boolean;
    BUMPIndex? : number;
}

interface TxWithBUMPV2 {
    formatFlag: TxFormatFlag;
    BUMPIndex? : number;
    transaction?: TxHexJsonObject;
    txid?: string;
}

enum TxFormatFlag {
    withoutBUMP = "00:withoutBUMP",
    withBUMP = "01:withBUMP",
    txidOnly = "02:txidOnly"
}

export function BEEFHexToJson(rawBEEFHex: string) : BEEFJsonObject {
    let cleanHex = rawBEEFHex.startsWith("0x") || rawBEEFHex.startsWith("0X") ? rawBEEFHex.slice(2) : rawBEEFHex;

    const hexRegex = /^(0x|0X)?[0-9a-fA-F]+$/;
    if (!hexRegex.test(cleanHex) || cleanHex.length % 2 == 1) {
        throw Error("Input string must be a valid hex string.")
    }

    const BEEFJsonObject : BEEFJsonObject = {
        version: "",
        BUMPsCount: 0,
        BUMPs: [],
        txCount: 0,
        txns: []
    }

    let begin = 0, end = 0;

    // 1. Version String: 4-byte (little endian) 
    //      AtomicBEEF prefix version string with "01010101" 4-byte and subject transaction id 32-byte (little endian)
    end = begin + VERSION_NUMBER_SIZE_IN_BYTES * 2
    let version = cleanHex.slice(begin, end); begin = end;

    if (version === ATOMIC_BEEF_PREFIX) {
        // parse Atomic BEEF's prefix
        end = begin + TXID_SIZE_IN_BYTES * 2
        const subjectTxid = convertEndianness(cleanHex.slice(begin, end)); begin = end;
        BEEFJsonObject['atomicSubjectTxid'] = subjectTxid

        end = begin + VERSION_NUMBER_SIZE_IN_BYTES * 2
        version = cleanHex.slice(begin, end) + '(Atomic)'; begin = end;
    }
    if (!version.includes("BEEF") && !version.includes("beef")) {
        throw Error("Invalid BEEF hex")
    }
    if (!version.startsWith("01") && !version.startsWith("02")) {
        throw Error(`BEEF version ${version} is not supported`)
    }
    BEEFJsonObject['version'] = version

    // 2. nBUMPs: variable-size integer
    let nBUMPs: number, actualSize: number
    [nBUMPs , actualSize] = parseVariableSizeInteger(cleanHex.slice(begin, begin + VARINT_SIZE_UPPERBOUND_IN_BYTES * 2))
    begin += actualSize
    BEEFJsonObject['BUMPsCount'] = nBUMPs

    // 3. BUMPs: 
    for (let i = 0; i < nBUMPs; i++) {
        const [BUMPJsonObject, remainingHex] = BUMPHexToJson(cleanHex.slice(begin))
        cleanHex = remainingHex; begin = 0;

        BEEFJsonObject['BUMPs'].push(BUMPJsonObject)
    }

    // 4. nTransactions: variable-size integer
    let nTransactions: number
    [nTransactions , actualSize] = parseVariableSizeInteger(cleanHex.slice(begin, begin + VARINT_SIZE_UPPERBOUND_IN_BYTES * 2))
    begin += actualSize
    BEEFJsonObject['txCount'] = nTransactions

    // 5. TransactionsWithBUMPs: 
    if (version.startsWith("01")) {
        BEEFJsonObject['txns'] = [] as TxWithBUMPV1[]
        for (let i = 0; i < nTransactions; i++) {
            const [TxJsonObject, remainingHex] = rawTxHexToJson(cleanHex.slice(begin))
            cleanHex = remainingHex; begin = 0;

            const txWithBUMPV1 : TxWithBUMPV1 = {
                transaction: TxJsonObject,
                hasBUMP: false
            }

            const hasBUMP = cleanHex.slice(begin, begin + 2); begin += 2;
            if (hasBUMP === "01") {
                let BUMPIndex: number
                [BUMPIndex, actualSize] = parseVariableSizeInteger(cleanHex.slice(begin, begin + VARINT_SIZE_UPPERBOUND_IN_BYTES * 2))
                begin += actualSize

                txWithBUMPV1['hasBUMP'] = true;
                txWithBUMPV1['BUMPIndex'] = BUMPIndex
            } else if (hasBUMP !== "00") {
                throw Error("Unkonwn hasBUMP flag")
            }

            BEEFJsonObject['txns'].push(txWithBUMPV1)
        }

    } else if (version.startsWith("02")) {
        BEEFJsonObject['txns'] = [] as TxWithBUMPV2[]
        for (let i = 0; i < nTransactions; i++) {
            const formatFlagByte = cleanHex.slice(begin, begin + 2); begin += 2
            
            let txWithBUMPV2 : TxWithBUMPV2 = {
                formatFlag: TxFormatFlag.withBUMP
            }

            if (formatFlagByte === "00") {
                txWithBUMPV2['formatFlag'] = TxFormatFlag.withoutBUMP

                const [TxJsonObject, remainingHex] = rawTxHexToJson(cleanHex.slice(begin))
                cleanHex = remainingHex; begin = 0;
                txWithBUMPV2['transaction'] = TxJsonObject

            } else if (formatFlagByte === "01") {
                txWithBUMPV2['formatFlag'] = TxFormatFlag.withBUMP

                let BUMPIndex: number
                [BUMPIndex, actualSize] = parseVariableSizeInteger(cleanHex.slice(begin, begin + VARINT_SIZE_UPPERBOUND_IN_BYTES * 2))
                begin += actualSize
                txWithBUMPV2['BUMPIndex'] = BUMPIndex

                const [TxJsonObject, remainingHex] = rawTxHexToJson(cleanHex.slice(begin))
                cleanHex = remainingHex; begin = 0;
                txWithBUMPV2['transaction'] = TxJsonObject
                
            } else if (formatFlagByte === "02") {
                txWithBUMPV2['formatFlag'] = TxFormatFlag.txidOnly

                end = begin + TXID_SIZE_IN_BYTES * 2
                const txid = convertEndianness(cleanHex.slice(begin, end)); begin = end;
                txWithBUMPV2['txid'] = txid

            } else {
                throw Error("Unknown txn data format flag")
            }

            BEEFJsonObject['txns'].push(txWithBUMPV2)
        }
    }

    return BEEFJsonObject
}
