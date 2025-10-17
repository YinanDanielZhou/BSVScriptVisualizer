import axios from 'axios';

export async function getRawTransactionHex(
    txHash: string,
    network = 'main'
): Promise<string> {
    const options = {
        method: 'GET',
        url:
            'https://api.whatsonchain.com/v1/bsv/' +
            network +
            '/tx/' +
            txHash +
            '/hex',
    }
    let returnString = ''
    returnString = await axios
        .request(options)
        .then(function ({ data }) {
            return data
            // console.log(data);
        })
        .catch(function (error: any) {
            console.error(error)
        })
    return returnString
}