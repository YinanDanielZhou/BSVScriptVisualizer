export function convertEndianness(inputHex: string): string {
    return `${inputHex.match(/.{2}/g)!.reverse().join("")}`
}

export function parseLittleEndianInteger(inputHex: string): number {
    return parseInt('0x' + convertEndianness(inputHex), 16)
}

export function parseLittleEndianBigInt(inputHex: string): bigint {
    return BigInt('0x' + convertEndianness(inputHex))
}

export function parseVariableSizeInteger(inputHex: string): [number, number] {
    // return the integer value and the total length in number of chars
    let firstByte = inputHex.slice(0, 2);
    let integer: number | bigint;
    let totalSize = 2
    if (firstByte == "fd" || firstByte == "FD") {
        // next 2 bytes
        totalSize += 4
        integer = parseLittleEndianInteger(inputHex.slice(2, 6));
    } else if (firstByte == "fe" || firstByte == "FE") {
        // next 4 bytes
        totalSize += 8
        integer = parseLittleEndianInteger(inputHex.slice(2, 10));
    } else if (firstByte == "ff" || firstByte == "FF") {
        throw Error("Extra large VarInt is not supported")
        // next 8 bytes
        totalSize += 16
        integer = parseLittleEndianBigInt(inputHex.slice(2, 18));
    } else {
        integer = parseLittleEndianInteger(firstByte)
    }
    return [integer, totalSize]
}