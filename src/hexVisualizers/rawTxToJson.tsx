import { convertEndianness, parseLittleEndianBigInt, parseLittleEndianInteger, parseVariableSizeInteger } from "./helpers";

import scriptToJson, { ScriptJsonObject } from './scriptToJson'

const VERSION_NUMBER_SIZE_IN_BYTES = 4;
const TXID_SIZE_IN_BYTES = 32;
const PREV_OUT_INDEX_SIZE_IN_BYTES = 4;
const NSEQUENCE_SIZE_IN_BYTES = 4;
const OUTPUTTED_SATS_AMOUNT_SIZE_IN_BYTES = 8;
const NLOCKTIME_SIZE_IN_BYTES = 4;
const VARINT_SIZE_UPPERBOUND_IN_BYTES = 9

export interface TxHexJsonObject {
    version: number;
    inputCount: number;
    inputs: InputHexJsonObject[];
    outputCount: number;
    outputs: OutputHexJsonObject[];
    nLocktime: number;
}

interface InputHexJsonObject {
    prevTxid: string;
    prevOutIndex: number;
    scriptLength: number;
    unlockingScript: ScriptJsonObject;
    nSequence: string | number;
}

interface OutputHexJsonObject {
    value: string;   // outptut sats amount is a bigint which is too large to be json.serialized
    scriptLength: number;
    lockingScript: ScriptJsonObject;
}

export function rawTxHexToJson(rawTxHex: string): [TxHexJsonObject, string] {
    const cleanHex = rawTxHex.startsWith("0x") || rawTxHex.startsWith("0X") ? rawTxHex.slice(2) : rawTxHex;

    const hexRegex = /^(0x|0X)?[0-9a-fA-F]+$/;
    if (!hexRegex.test(cleanHex) || cleanHex.length % 2 == 1) {
        throw Error("Input string must be a valid hex string.")
    }

    let txJson: TxHexJsonObject = {
        version: 0,
        inputCount: 0,
        inputs: [],
        outputCount: 0,
        outputs: [],
        nLocktime: 0
    };

    let begin = 0, end = 0;

    // 1. Version: 4-byte integer (little-endian)
    end = begin + VERSION_NUMBER_SIZE_IN_BYTES * 2
    const version = parseLittleEndianInteger(cleanHex.slice(begin, end)); begin = end;
    if (version > 1) {
        throw Error(`Transaction version ${version} is not supported. Or the raw hex is not well formatted.`)
    }
    txJson['version'] = version


    // 2. Input Count: variable-length integer
    let inputCount: number, actualSize: number
    [inputCount , actualSize] = parseVariableSizeInteger(cleanHex.slice(begin, begin + VARINT_SIZE_UPPERBOUND_IN_BYTES * 2))
    begin += actualSize
    txJson['inputCount'] = inputCount


    // 3. Inputs: a list of input objects, where each input object has the following fields:
    //      Previous Transaction Hash: 32-byte hash (little-endian)
    //      Previous Transaction Output Index: 4-byte integer (little-endian)
    //      Script Length: variable-length integer
    //      Unlocking Script: variable-length script
    //      Sequence Number: 4-byte integer (little-endian)
    
    for (let i = 0; i < inputCount; i++) {
        //      Previous Transaction Hash: 32-byte hash (little-endian)
        end = begin + TXID_SIZE_IN_BYTES * 2
        const prevTxid = convertEndianness(cleanHex.slice(begin, end)); begin = end;

        //      Previous Transaction Output Index: 4-byte integer (little-endian)
        end = begin + PREV_OUT_INDEX_SIZE_IN_BYTES * 2
        const prevOutIndex = parseLittleEndianInteger(cleanHex.slice(begin, end)); begin = end;

        //      Script Length: variable-length integer (unit: bytes)
        let scriptLength: number, actualSize: number;
        [scriptLength , actualSize] = parseVariableSizeInteger(cleanHex.slice(begin, begin + VARINT_SIZE_UPPERBOUND_IN_BYTES * 2))
        begin += actualSize

        //      Unlocking Script: variable-length script
        end = begin + scriptLength * 2
        const unlockingScriptHex = cleanHex.slice(begin, end); begin = end;
        const unlockingScriptJson = scriptToJson(unlockingScriptHex)

        //      Sequence Number: 4-byte integer (little-endian)
        end = begin + NSEQUENCE_SIZE_IN_BYTES * 2
        const nSeq = parseLittleEndianInteger(cleanHex.slice(begin, end)); begin = end;

        const inputScriptJson : InputHexJsonObject = {
            prevTxid: prevTxid,
            prevOutIndex: prevOutIndex,
            scriptLength: scriptLength,
            unlockingScript: unlockingScriptJson,
            nSequence: nSeq === 4294967295 ? "Finalized" : nSeq
        }
        txJson['inputs'].push(inputScriptJson)
    }

    // 4. Output Count: variable-length integer
    let outputCount: number;
    [outputCount , actualSize] = parseVariableSizeInteger(cleanHex.slice(begin, begin + VARINT_SIZE_UPPERBOUND_IN_BYTES * 2))
    begin += actualSize
    txJson['outputCount'] = outputCount

    // 5. Outputs: a list of output objects, where each output object has the following fields:
    //      Value: 8-byte integer (little-endian)
    //      Script Length: variable-length integer
    //      Locking Script: variable-length script

    for (let i = 0; i < outputCount; i++) {
        //      Value: 8-byte integer (little-endian)
        end = begin + OUTPUTTED_SATS_AMOUNT_SIZE_IN_BYTES * 2
        const outputSatsAmount = parseLittleEndianBigInt(cleanHex.slice(begin, end)); begin = end;

        //      Script Length: variable-length integer
        let scriptLength: number, actualSize: number;
        [scriptLength , actualSize] = parseVariableSizeInteger(cleanHex.slice(begin, begin + VARINT_SIZE_UPPERBOUND_IN_BYTES * 2))
        begin += actualSize

        //      Locking Script: variable-length script
        end = begin + scriptLength * 2
        const lockingScriptHex = cleanHex.slice(begin, end); begin = end;
        const lockingScriptJson = scriptToJson(lockingScriptHex)

        const outputScriptJson : OutputHexJsonObject = {
            value : String(outputSatsAmount),
            scriptLength : scriptLength,
            lockingScript : lockingScriptJson
        }
        txJson['outputs'].push(outputScriptJson)
    }

    // 6. Locktime: 4-byte integer (little-endian)
    end = begin + NLOCKTIME_SIZE_IN_BYTES * 2
    const nLocktime = parseLittleEndianInteger(cleanHex.slice(begin, end)); begin = end;
    txJson['nLocktime'] = nLocktime

    return [txJson, cleanHex.slice(begin)]
}
