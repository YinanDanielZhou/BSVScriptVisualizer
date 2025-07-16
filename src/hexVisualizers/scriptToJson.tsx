import { Script } from "@bsv/sdk";
import { OP } from '@bsv/sdk'
import { convertEndianness } from "./helpers";

export interface ScriptJsonObject {
    op_codes: string[]
}

function scriptToJson(scriptHex: string) : ScriptJsonObject {
    const cleanHex = scriptHex.startsWith("0x") || scriptHex.startsWith("0X") ? scriptHex.slice(2) : scriptHex;

    const hexRegex = /^(0x|0X)?[0-9a-fA-F]+$/;
    if (!hexRegex.test(cleanHex) || cleanHex.length % 2 == 1) {
        throw Error("Input string must be a valid hex string.")
    }

    const scriptJson : ScriptJsonObject = {
        op_codes : []
    }

    let begin = 0;
    let nextByte : number;
    while (begin < cleanHex.length) {
        nextByte = parseInt(cleanHex.slice(begin, begin + 2), 16); begin += 2
        if ( nextByte < 79 && 0 < nextByte) {
            // OP_PUSHDATA with varies sizes in bytes
            let sizeToPush;
            if (nextByte === 76) {
                // OP_PUSHDATA1, the next byte is the sizeToPush
                sizeToPush = parseInt(cleanHex.slice(begin, begin + 2), 16); begin += 2

            } else if (nextByte === 77) {
                // OP_PUSHDATA2, the next 2 bytes are the sizeToPush in little endian
                sizeToPush = parseInt(convertEndianness(cleanHex.slice(begin, begin + 4)), 16); begin += 4
                
            } else if (nextByte === 78) {
                // OP_PUSHDATA4, the next 4 bytes are the sizeToPush in little endian
                sizeToPush = parseInt(convertEndianness(cleanHex.slice(begin, begin + 8)), 16); begin += 8

            } else {
                // nextByte is the sizeToPush
                sizeToPush = nextByte
            }

            scriptJson['op_codes'].push(`OP_PUSHDATA(${sizeToPush.toString()} bytes)`)
            // push the next sizeToPush bytes 
            scriptJson['op_codes'].push(cleanHex.slice(begin, begin + sizeToPush * 2)); begin += sizeToPush * 2

        } else {
            scriptJson['op_codes'].push(OP[nextByte])
        }
    }
    return scriptJson
}

export default scriptToJson